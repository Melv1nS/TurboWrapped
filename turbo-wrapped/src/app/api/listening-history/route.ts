import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import rateLimit from "@/app/lib/rate-limit";

// Initialize rate limiter for listening-history endpoint
const limiter = rateLimit('listening-history');

export async function GET(request: Request) {
    try {
        // Get session and token for rate limiting
        const session = await getServerSession(OPTIONS);
        const token = session?.user?.email || 
            request.headers.get('x-forwarded-for') || 
            'anonymous';
        
        // Check rate limit (30 requests per minute as configured)
        const { success, remaining, limit, resetIn } = await limiter.check(token);
        
        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': (resetIn / 1000).toString(),
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': (Date.now() + resetIn).toString()
                    }
                }
            );
        }

        // Authorization check
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            // Parse parameters
            const { searchParams } = new URL(request.url);
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');

            // Validate pagination parameters
            if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
                return NextResponse.json(
                    { error: "Invalid pagination parameters" },
                    { status: 400 }
                );
            }

            // Get user
            const user = await prisma.user.findUnique({
                where: { email: session.user.email }
            });

            if (!user) {
                return NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                );
            }

            // Create where clause with date range
            const whereClause = {
                userId: user.id,
                ...(startDate && endDate ? {
                    playedAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                } : {})
            };

            // Fetch data with pagination and date range
            const [history, total, uniqueArtists] = await Promise.all([
                prisma.listeningHistory.findMany({
                    where: whereClause,
                    orderBy: { playedAt: 'desc' },
                    take: limit,
                    skip: (page - 1) * limit
                }),
                prisma.listeningHistory.count({
                    where: whereClause
                }),
                prisma.listeningHistory.findMany({
                    where: whereClause,
                    select: { artistName: true },
                    distinct: ['artistName']
                })
            ]);

            // Create response with data and metadata
            const response = NextResponse.json({
                history,
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                uniqueArtists: uniqueArtists.map(a => a.artistName)
            });

            // Set cache headers
            response.headers.set('Cache-Control', 'private, max-age=60');
            response.headers.set('Vary', 'Cookie, Authorization');
            
            // Add performance headers
            response.headers.set('Timing-Allow-Origin', '*');
            response.headers.set('X-Content-Type-Options', 'nosniff');
            
            // Add rate limit headers
            response.headers.set('X-RateLimit-Limit', limit.toString());
            response.headers.set('X-RateLimit-Remaining', remaining.toString());
            response.headers.set('X-RateLimit-Reset', (Date.now() + resetIn).toString());

            return response;

        } catch (error) {
            console.error('Error fetching listening history:', error);
            
            // Add rate limit headers even to error responses
            const errorResponse = NextResponse.json(
                { error: "Failed to fetch listening history" },
                { status: 500 }
            );
            
            errorResponse.headers.set('X-RateLimit-Limit', limit.toString());
            errorResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
            errorResponse.headers.set('X-RateLimit-Reset', (Date.now() + resetIn).toString());

            return errorResponse;
        }

    } catch (error) {
        console.error('Error fetching listening history:', error);
        return NextResponse.json(
            { error: "Failed to fetch listening history" },
            { 
                status: 500,
                headers: {
                    'Cache-Control': 'no-store'
                }
            }
        );
    }
}