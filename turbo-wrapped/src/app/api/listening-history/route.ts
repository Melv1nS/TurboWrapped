import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import rateLimit from "@/app/lib/rate-limit";

// Initialize rate limiter
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500
});

export async function GET(request: Request) {
    try {
        // Get session first for the email
        const session = await getServerSession(OPTIONS);
        
        // Use email as token, fallback to IP address, then to 'anonymous'
        const token = session?.user?.email || 
            request.headers.get('x-forwarded-for') || 
            'anonymous';
        
        // Check rate limit (30 requests per minute)
        const { success, remaining } = await limiter.check(token, 30);
        
        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Limit': '30',
                        'X-RateLimit-Remaining': '0'
                    }
                }
            );
        }

        // Your existing authorization check
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const whereClause = {
            userId: user.id,
            ...(startDate && endDate ? {
                playedAt: {
                    gte: new Date(startDate),
                    // Set to midnight of the next day to include all songs from the end date
                    lte: new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))
                }
            } : {})
        };

        const [history, total] = await Promise.all([
            prisma.listeningHistory.findMany({
                where: whereClause,
                orderBy: { playedAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.listeningHistory.count({
                where: whereClause
            })
        ]);

        // Calculate stats correctly
        const [uniqueTracksResult, uniqueArtistsResult, totalDuration] = await Promise.all([
            prisma.listeningHistory.findMany({
                where: whereClause,
                select: {
                    trackId: true
                },
                distinct: ['trackId']
            }),
            prisma.listeningHistory.findMany({
                where: whereClause,
                select: {
                    artistName: true
                },
                distinct: ['artistName']
            }),
            prisma.listeningHistory.aggregate({
                where: whereClause,
                _sum: {
                    duration: true
                }
            })
        ]);

        const stats = {
            totalTracks: total,
            uniqueTracks: uniqueTracksResult.length,
            uniqueArtists: uniqueArtistsResult.length,
            totalDuration: totalDuration._sum.duration || 0
        };

        return NextResponse.json({
            history,
            stats,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        });

    } catch (error) {
        console.error('Error fetching listening history:', error);
        return NextResponse.json(
            { error: "Failed to fetch listening history" },
            { status: 500 }
        );
    }
}