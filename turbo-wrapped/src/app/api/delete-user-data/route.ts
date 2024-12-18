import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";

export async function DELETE(request: Request) {
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

        // Only delete listening history, don't change tracking status
        await prisma.listeningHistory.deleteMany({
            where: { userId: user.id }
        });

        return NextResponse.json({ 
            success: true,
            message: "All listening history has been deleted successfully" 
        });
    } catch (error) {
        console.error('Error deleting user data:', error);
        return NextResponse.json(
            { error: "Failed to delete user data" },
            { status: 500 }
        );
    }
}