import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

interface GenreCount {
    name: string;
    count: number;
}

export async function GET(request: Request) {
    const session = await getServerSession(OPTIONS);
    
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.error === 'RefreshAccessTokenError') {
        return NextResponse.json(
            { error: "Your session has expired. Please sign in again." },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || 'medium_term';

    const validTimeRanges = ['short_term', 'medium_term', 'long_term'];
    if (!validTimeRanges.includes(timeRange)) {
        return NextResponse.json(
            { error: "Invalid time range. Must be one of: short_term, medium_term, long_term" },
            { status: 400 }
        );
    }

    try {
        // Get user's top tracks
        const tracksResponse = await fetch(
            `https://api.spotify.com/v1/me/top/tracks?limit=30&time_range=${timeRange}`,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            }
        );

        if (!tracksResponse.ok) {
            throw new Error(`Failed to fetch top tracks: ${tracksResponse.statusText}`);
        }

        const tracksData = await tracksResponse.json();
        
        // Get unique artist IDs from the tracks
        const uniqueArtistIds = [...new Set(
            tracksData.items.flatMap((track: any) => 
                track.artists.map((artist: any) => artist.id)
            )
        )];

        // Fetch artist details to get genres
        const artistResponses = await Promise.all(
            uniqueArtistIds.map(artistId =>
                fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                })
            )
        );

        // Count genres from artists
        const genreCounts: { [key: string]: number } = {};
        
        for (const response of artistResponses) {
            if (response.ok) {
                const artistData = await response.json();
                if (artistData.genres && Array.isArray(artistData.genres)) {
                    artistData.genres.forEach((genre: string) => {
                        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                    });
                }
            }
        }

        // Sort genres by count
        const sortedGenres = Object.entries(genreCounts)
            .map(([name, count]): GenreCount => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json(sortedGenres);

    } catch (error) {
        console.error('Error fetching genres:', error);
        return NextResponse.json(
            { error: "Failed to fetch genres" },
            { status: 500 }
        );
    }
}
