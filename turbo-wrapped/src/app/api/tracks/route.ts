import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

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
            `https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=${timeRange}`,
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

        // Filter and transform the response data
        const filteredData = {
            items: data.items.map((track: any) => ({
                id: track.id,
                name: track.name,
                artists: track.artists.map((artist: any) => ({
                    id: artist.id,
                    name: artist.name,
                })),
                album: {
                    name: track.album.name,
                    images: [track.album.images[0]], // Only include the largest image
                    release_date: track.album.release_date,
                },
                duration_ms: track.duration_ms,
            }))
        };

        // Create response with cache headers
        const apiResponse = NextResponse.json(filteredData);
        
        // Set cache control headers
        apiResponse.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
        apiResponse.headers.set('Vary', 'Cookie, Authorization');

        return apiResponse;

    } catch (error) {
        console.error('Error fetching tracks:', error);
        return NextResponse.json(
            { error: "Failed to fetch top tracks" },
            { status: 500 }
        );
    }
}