import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";

export async function GET(request: Request) {
    const session = await getServerSession(OPTIONS);
    
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get all listening history entries for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const listeningHistory = await prisma.listeningHistory.findMany({
            where: { 
                userId: user.id,
                playedAt: {
                    gte: thirtyDaysAgo
                }
            },
            orderBy: {
                playedAt: 'asc'
            }
        });

        // Initialize data structures
        const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
        const durationData = Array(7).fill(0).map(() => Array(24).fill(0));
        const dailyPlays = Array(7).fill(false);

        // Add error handling for date parsing
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

        // Calculate streak
        const calculateStreak = (dailyPlaysData: boolean[]) => {
            let currentStreak = 0;
            let longestStreak = 0;
            let currentStreakStart = null;
            let longestStreakStart = null;
            let longestStreakEnd = null;

            dailyPlaysData.forEach((hasPlays, index) => {
                if (hasPlays) {
                    currentStreak++;
                    if (currentStreakStart === null) {
                        currentStreakStart = index;
                    }
                    if (currentStreak > longestStreak) {
                        longestStreak = currentStreak;
                        longestStreakStart = currentStreakStart;
                        longestStreakEnd = index;
                    }
                } else {
                    currentStreak = 0;
                    currentStreakStart = null;
                }
            });

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return {
                count: longestStreak,
                startDay: longestStreakStart !== null ? days[longestStreakStart] : null,
                endDay: longestStreakEnd !== null ? days[longestStreakEnd] : null
            };
        };

        // Calculate some additional stats
        const totalPlays = listeningHistory.length;
        const totalDuration = listeningHistory.reduce((sum, entry) => sum + entry.duration, 0);
        
        const peakHour = heatmapData.flat().indexOf(Math.max(...heatmapData.flat())) % 24;
        const peakDay = heatmapData.findIndex(day => 
            day.includes(Math.max(...heatmapData.flat()))
        );

        const streakInfo = calculateStreak(dailyPlays);

        return NextResponse.json({
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

    } catch (error) {
        console.error('Error fetching listening patterns:', error);
        return NextResponse.json(
            { error: "Failed to fetch listening patterns", details: error.message },
            { status: 500 }
        );
    }
}