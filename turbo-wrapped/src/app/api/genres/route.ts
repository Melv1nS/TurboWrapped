import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

interface Artist {
    genres: string[];
}

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
        const spotifyResponse = await fetch(
            `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${timeRange}`,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                next: {
                    revalidate: 3600 // Cache for 1 hour
                }
            }
        );

        if (!spotifyResponse.ok) {
            throw new Error(`Spotify API error: ${spotifyResponse.statusText}`);
        }

        const data = await spotifyResponse.json();
        
        // Count genre occurrences
        const genreCounts: { [key: string]: number } = {};
        data.items.forEach((artist: Artist) => {
            artist.genres.forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
        });

        // Convert to array and sort by count
        const sortedGenres: GenreCount[] = Object.entries(genreCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 100); // Get top 100 genres

        // Create response with cache headers
        const apiResponse = NextResponse.json(sortedGenres);
        
        // Set cache control headers
        apiResponse.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
        apiResponse.headers.set('Vary', 'Cookie, Authorization');

        return apiResponse;

    } catch (error) {
        console.error('Error fetching genres:', error);
        return NextResponse.json(
            { error: "Failed to fetch genres" },
            { status: 500 }
        );
    }
}
