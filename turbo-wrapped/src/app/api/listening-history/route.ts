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
    const session = await getServerSession(OPTIONS);
    
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get pagination parameters from URL
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20'); // Default to 20 items per page

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get all unique artists from the user's entire history
        const uniqueArtists = await prisma.listeningHistory.findMany({
            where: { userId: user.id },
            select: { artistName: true },
            distinct: ['artistName']
        });

        // Get the recent history for display with pagination
        const [history, total] = await Promise.all([
            prisma.listeningHistory.findMany({
                where: { userId: user.id },
                orderBy: { playedAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.listeningHistory.count({
                where: { userId: user.id }
            })
        ]);

        return NextResponse.json({
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
    } catch (error) {
        console.error('Error fetching listening history:', error);
        return NextResponse.json(
            { error: "Failed to fetch listening history" },
            { status: 500 }
        );
    }
}