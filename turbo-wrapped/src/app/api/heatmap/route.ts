import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";
import rateLimit from "@/app/lib/rate-limit";

// Initialize rate limiter for heatmap endpoint
const limiter = rateLimit('heatmap');

export async function GET(request: Request) {
    try {
        // Get session and token for rate limiting
        const session = await getServerSession(OPTIONS);
        const token = session?.user?.email || 
            request.headers.get('x-forwarded-for') || 
            'anonymous';
        
        // Check rate limit (20 requests per minute as configured)
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

            // Calculate date range
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Fetch listening history
            const listeningHistory = await prisma.listeningHistory.findMany({
                where: { 
                    userId: user.id,
                    playedAt: {
                        gte: thirtyDaysAgo
                    }
                },
                select: {
                    playedAt: true,
                    duration: true
                },
                orderBy: {
                    playedAt: 'asc'
                }
            });

            // Initialize data structures
            const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
            const durationData = Array(7).fill(0).map(() => Array(24).fill(0));
            const dailyPlays = Array(7).fill(false);

            // Process listening history
            listeningHistory.forEach(entry => {
                try {
                    const date = new Date(entry.playedAt);
                    if (isNaN(date.getTime())) {
                        console.error('Invalid date:', entry.playedAt);
                        return;
                    }
                    
                    const hour = date.getHours();
                    const day = date.getDay();

                    if (hour >= 0 && hour < 24 && day >= 0 && day < 7) {
                        heatmapData[day][hour]++;
                        durationData[day][hour] += entry.duration;
                        dailyPlays[day] = true;
                    }
                } catch (error) {
                    console.error('Error processing entry:', error);
                }
            });

            // Calculate streak information
            const streakInfo = calculateStreak(dailyPlays);

            // Calculate additional stats
            const totalPlays = listeningHistory.length;
            const totalDuration = listeningHistory.reduce((sum, entry) => sum + entry.duration, 0);
            const peakHour = heatmapData.flat().indexOf(Math.max(...heatmapData.flat())) % 24;
            const peakDay = heatmapData.findIndex(day => 
                day.includes(Math.max(...heatmapData.flat()))
            );

            // Create response with all data
            const response = NextResponse.json({
                heatmap: heatmapData,
                duration: durationData,
                timeRange: {
                    start: thirtyDaysAgo.toISOString(),
                    end: new Date().toISOString()
                },
                stats: {
                    totalPlays,
                    totalDuration,
                    peakListening: {
                        hour: peakHour,
                        day: peakDay
                    },
                    streak: streakInfo
                }
            });

            // Set cache headers (short TTL since data changes frequently)
            response.headers.set('Cache-Control', 'private, max-age=300');
            response.headers.set('Vary', 'Cookie, Authorization');
            
            // Add rate limit headers
            response.headers.set('X-RateLimit-Limit', limit.toString());
            response.headers.set('X-RateLimit-Remaining', remaining.toString());
            response.headers.set('X-RateLimit-Reset', (Date.now() + resetIn).toString());

            return response;

        } catch (error) {
            console.error('Error fetching listening patterns:', error);
            
            // Add rate limit headers even to error responses
            const errorResponse = NextResponse.json(
                { error: "Failed to fetch listening patterns" },
                { status: 500 }
            );
            
            errorResponse.headers.set('X-RateLimit-Limit', limit.toString());
            errorResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
            errorResponse.headers.set('X-RateLimit-Reset', (Date.now() + resetIn).toString());

            return errorResponse;
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: "Failed to process request", details: error.message },
            { status: 500 }
        );
    }
}