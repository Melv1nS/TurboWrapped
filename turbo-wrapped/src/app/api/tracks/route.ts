import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getServerSession(OPTIONS);
    
    if (!session?.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for refresh token error
    if (session.error === 'RefreshAccessTokenError') {
        return NextResponse.json(
            { error: "Your session has expired. Please sign in again." },
            { status: 401 }
        );
    }

    // Get time_range from URL params, default to medium_term if not specified
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || 'medium_term';

    // Validate time_range parameter
    const validTimeRanges = ['short_term', 'medium_term', 'long_term'];
    if (!validTimeRanges.includes(timeRange)) {
        return NextResponse.json(
            { error: "Invalid time range. Must be one of: short_term, medium_term, long_term" },
            { status: 400 }
        );
    }

    const response = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=${timeRange}`,
        {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        }
    );

    if (!response.ok) {
        return NextResponse.json(
            { error: "Failed to fetch top tracks" },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
}