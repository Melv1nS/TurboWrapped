// src/app/api/artist-locations/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";
import rateLimit from "@/app/lib/rate-limit";

// Initialize rate limiter
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500
});

export async function GET(request: Request) {
    try {
        const session = await getServerSession(OPTIONS);
        
        // Use email as token, fallback to IP address, then to 'anonymous'
        const token = session?.user?.email || 
            request.headers.get('x-forwarded-for') || 
            'anonymous';
        
        // Check rate limit (30 requests per minute)
        const { success, remaining } = await limiter.check(token, 30);
        
        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Limit': '30',
                        'X-RateLimit-Remaining': remaining.toString()
                    }
                }
            );
        }

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const locations = await prisma.artistLocation.findMany({
            where: {
                latitude: { not: null },
                longitude: { not: null }
            }
        });

        // Create response with data
        const response = NextResponse.json({ locations });

        // Add cache control headers
        // Artist locations change less frequently, so we can cache longer
        response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
        response.headers.set('Vary', 'Cookie, Authorization');
        
        // Add performance headers
        response.headers.set('Timing-Allow-Origin', '*');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', '30');
        response.headers.set('X-RateLimit-Remaining', remaining.toString());

        return response;

    } catch (error) {
        console.error('Error fetching artist locations:', error);
        return NextResponse.json(
            { error: "Failed to fetch artist locations" },
            { 
                status: 500,
                headers: {
                    'Cache-Control': 'no-store'
                }
            }
        );
    }
}