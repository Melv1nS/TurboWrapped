import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";

export async function GET(request: Request) {
    const session = await getServerSession(OPTIONS);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get genre stats
        const genres = await prisma.listeningHistory.groupBy({
            by: ['genres'],
            where: { userId: user.id },
            _count: true,
        });

        // Get duration range
        const durationStats = await prisma.listeningHistory.aggregate({
            where: { userId: user.id },
            _min: { duration: true },
            _max: { duration: true },
        });

        return NextResponse.json({
            genres: genres.map(g => ({
                name: g.genres[0], // Assuming genres is a string array with one item
                count: g._count,
            })),
            durationRange: {
                min: durationStats._min.duration || 0,
                max: durationStats._max.duration || 600000, // 10 minutes default
            },
        });

    } catch (error) {
        console.error('Error fetching filter stats:', error);
        return NextResponse.json(
            { error: "Failed to fetch filter stats" },
            { status: 500 }
        );
    }
}