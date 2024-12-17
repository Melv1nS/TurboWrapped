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
                        'X-RateLimit-Remaining': remaining.toString()
                    }
                }
            );
        }

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const [history, total, uniqueArtists] = await Promise.all([
            prisma.listeningHistory.findMany({
                where: { userId: user.id },
                orderBy: { playedAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.listeningHistory.count({
                where: { userId: user.id }
            }),
            prisma.listeningHistory.findMany({
                where: { userId: user.id },
                select: { artistName: true },
                distinct: ['artistName']
            })
        ]);

        // Create the response with the data
        const response = NextResponse.json({
            history,
            uniqueArtists: uniqueArtists.map(a => a.artistName),
            stats: {
                totalTracks: total,
            },
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        });

        // Add cache control headers
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        response.headers.set('Vary', 'Cookie, Authorization');
        
        // Add performance headers
        response.headers.set('Timing-Allow-Origin', '*');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', '30');
        response.headers.set('X-RateLimit-Remaining', remaining.toString());

        return response;

    } catch (error) {
        console.error('Error fetching listening history:', error);
        return NextResponse.json(
            { error: "Failed to fetch listening history" },
            { 
                status: 500,
                headers: {
                    'Cache-Control': 'no-store'
                }
            }
        );
    }
}