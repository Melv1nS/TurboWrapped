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
        // Add caching headers to the request
        const tracksResponse = await fetch(
            `https://api.spotify.com/v1/me/top/tracks?limit=30&time_range=${timeRange}`,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                next: {
                    revalidate: 3600 // Cache for 1 hour
                }
            }
        );

        if (!tracksResponse.ok) {
            throw new Error(`Failed to fetch top tracks: ${tracksResponse.statusText}`);
        }

        const tracksData = await tracksResponse.json();
        
        // Get unique artist IDs and batch the requests
        const uniqueArtistIds = [...new Set(
            tracksData.items.flatMap((track: any) => 
                track.artists.map((artist: any) => artist.id)
            )
        )];

        // Batch artist requests in groups of 5 to avoid rate limits
        const batchSize = 5;
        const artistGenres: { [key: string]: number } = {};
        
        for (let i = 0; i < uniqueArtistIds.length; i += batchSize) {
            const batch = uniqueArtistIds.slice(i, i + batchSize);
            
            const batchPromises = batch.map(artistId =>
                fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    next: {
                        revalidate: 3600 // Cache artist data for 1 hour
                    }
                })
            );

            const responses = await Promise.all(batchPromises);
            const artistsData = await Promise.all(
                responses.map(async (response) => {
                    if (!response.ok) return null;
                    return response.json();
                })
            );

            // Process each artist's genres
            artistsData.forEach(artist => {
                if (artist?.genres) {
                    artist.genres.forEach((genre: string) => {
                        artistGenres[genre] = (artistGenres[genre] || 0) + 1;
                    });
                }
            });
        }

        // Sort genres by count
        const sortedGenres = Object.entries(artistGenres)
            .map(([name, count]): GenreCount => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Create response with cache headers
        const response = NextResponse.json(sortedGenres);
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

        return response;

    } catch (error) {
        console.error('Error fetching genres:', error);
        return NextResponse.json(
            { error: "Failed to fetch genres" },
            { status: 500 }
        );
    }
}
