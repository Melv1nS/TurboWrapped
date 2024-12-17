import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import rateLimit from "@/app/lib/rate-limit";

// Initialize rate limiter
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max number of unique tokens per interval
});

export async function GET(request: Request) {
    try {
        // Apply rate limiting before session check
        const session = await getServerSession(OPTIONS);
        const token = session?.user?.email || request.headers.get('x-forwarded-for') || 'anonymous';
        const { success, remaining } = await limiter.check(token, 30); // 30 requests per minute
        
        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Limit': '30',
                        'X-RateLimit-Remaining': '0'
                    }
                }
            );
        }

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
                `https://api.spotify.com/v1/me/top/artists?limit=20&time_range=${timeRange}`,
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
                items: data.items.map((artist: any) => ({
                    id: artist.id,
                    name: artist.name,
                    images: [artist.images[0]], // Only include the largest image
                    genres: artist.genres,
                    followers: {
                        total: artist.followers.total
                    },
                    popularity: artist.popularity,
                    external_urls: {
                        spotify: artist.external_urls.spotify
                    }
                }))
            };

            // Create response with cache headers
            const apiResponse = NextResponse.json(filteredData);
            
            // Set cache control headers
            apiResponse.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
            apiResponse.headers.set('Vary', 'Cookie, Authorization');
            
            // Add rate limit headers
            apiResponse.headers.set('X-RateLimit-Limit', '30');
            apiResponse.headers.set('X-RateLimit-Remaining', remaining.toString());

            return apiResponse;

        } catch (error) {
            console.error('Error fetching artists:', error);
            return NextResponse.json(
                { error: "Failed to fetch top artists" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Rate limit error:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}