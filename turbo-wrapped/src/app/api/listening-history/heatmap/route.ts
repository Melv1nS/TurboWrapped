import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../../auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";

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

        // Fetch all listening history for heatmap
        const history = await prisma.listeningHistory.findMany({
            where: { userId: user.id },
            orderBy: { playedAt: 'desc' }
        });

        return NextResponse.json({
            history,
            uniqueArtists: [...new Set(history.map(item => item.artistName))]
        });

    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        return NextResponse.json(
            { error: "Failed to fetch heatmap data" },
            { status: 500 }
        );
    }
} 