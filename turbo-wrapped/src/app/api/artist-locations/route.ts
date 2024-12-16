// src/app/api/artist-locations/route.ts
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
        const locations = await prisma.artistLocation.findMany({
            where: {
                latitude: { not: null },
                longitude: { not: null }
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