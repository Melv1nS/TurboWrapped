import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getServerSession(OPTIONS);
    
    if (!session?.token?.access_token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
        'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term',
        {
            headers: {
                Authorization: `Bearer ${session.token.access_token}`,
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