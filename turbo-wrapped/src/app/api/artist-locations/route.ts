// src/app/api/artist-locations/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
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
        // Parse date parameters
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // First get the artists from the filtered listening history
        const historyWhereClause = {
            userId: user.id,
            ...(startDate && endDate ? {
                playedAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            } : {})
        };

        const artists = await prisma.listeningHistory.findMany({
            where: historyWhereClause,
            select: { artistName: true },
            distinct: ['artistName']
        });

        // Then get locations for these artists
        const locations = await prisma.artistLocation.findMany({
            where: {
                artistName: {
                    in: artists.map(a => a.artistName)
                }
            }
        });

        return NextResponse.json({ locations });
    } catch (error) {
        console.error('Error fetching artist locations:', error);
        return NextResponse.json(
            { error: "Failed to fetch artist locations" },
            { status: 500 }
        );
    }
}