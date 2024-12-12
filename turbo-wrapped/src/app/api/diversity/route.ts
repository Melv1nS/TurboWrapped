import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";
import { calculateDiversity, normalizeDiversity } from "@/app/utils/diversityCalculations";

export async function GET(request: Request) {
    const session = await getServerSession(OPTIONS);
    
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const listeningHistory = await prisma.listeningHistory.findMany({
            where: { 
                userId: user.id,
                playedAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                genres: true,
                artistName: true,
                albumName: true,
                playedAt: true
            }
        });

        // Initialize diversity tracking
        const genreCounts: Record<string, number> = {};
        const artistCounts: Record<string, number> = {};
        const albumCounts: Record<string, number> = {};

        // Process tracks for diversity metrics
        listeningHistory.forEach(entry => {
            // Genre diversity
            entry.genres.forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });

            // Artist diversity
            artistCounts[entry.artistName] = (artistCounts[entry.artistName] || 0) + 1;

            // Album diversity (as a proxy for era diversity)
            albumCounts[entry.albumName] = (albumCounts[entry.albumName] || 0) + 1;
        });

        // Calculate diversity metrics
        const diversityMetrics = {
            genreDiversity: normalizeDiversity(
                calculateDiversity(genreCounts),
                20 // max expected genres
            ),
            artistDiversity: normalizeDiversity(
                calculateDiversity(artistCounts),
                100 // max expected artists
            ),
            albumDiversity: normalizeDiversity(
                calculateDiversity(albumCounts),
                200 // max expected albums
            ),
        };

        return NextResponse.json({
            diversity: diversityMetrics
        });

    } catch (error) {
        console.error('Error fetching listening patterns:', error);
        return NextResponse.json(
            { error: "Failed to fetch listening patterns", details: error.message },
            { status: 500 }
        );
    }
}