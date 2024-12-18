import { getServerSession } from "next-auth/next";
import { OPTIONS } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(OPTIONS);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Fetch user's listening history
    const history = await prisma.listeningHistory.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        playedAt: 'desc',
      },
    });

    // Convert to CSV format
    const csvHeader = "Timestamp,Track Name,Artist Name,Album Name,Duration (ms),Genres\n";
    const csvRows = history.map(entry => {
      return `"${entry.playedAt.toISOString()}","${entry.trackName}","${entry.artistName}","${entry.albumName}","${entry.duration}","${entry.genres.join(';')}"`
    }).join("\n");
    
    const csv = csvHeader + csvRows;

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="listening-history-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}