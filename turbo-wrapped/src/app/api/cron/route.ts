import { NextResponse } from "next/server";
import prisma from '@/app/lib/prisma';
import { OPTIONS } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
    // Verify the request is from GitHub Actions
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    console.log(`Starting history update at ${new Date().toISOString()}`);

    try {
        const users = await prisma.user.findMany({
            where: { trackingEnabled: true },
            include: {
                accounts: {
                    where: { provider: 'spotify' }
                }
            }
        });

        const results = [];
        
        for (const user of users) {
            const spotifyAccount = user.accounts[0];
            if (!spotifyAccount?.access_token) continue;

            try {
                // Get last tracked song for this user
                const lastTrack = await prisma.listeningHistory.findFirst({
                    where: { userId: user.id },
                    orderBy: { playedAt: 'desc' }
                });

                const after = lastTrack 
                    ? new Date(lastTrack.playedAt).getTime()
                    : new Date(Date.now() - 4 * 60 * 60 * 1000).getTime();

                const response = await fetch(
                    `https://api.spotify.com/v1/me/player/recently-played?after=${after}&limit=50`,
                    {
                        headers: {
                            Authorization: `Bearer ${spotifyAccount.access_token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Spotify API error: ${response.statusText}`);
                }

                const data = await response.json();
                
                for (const item of data.items) {
                    await prisma.listeningHistory.upsert({
                        where: {
                            userId_trackId_playedAt: {
                                userId: user.id,
                                trackId: item.track.id,
                                playedAt: new Date(item.played_at)
                            }
                        },
                        update: {}, // No updates if exists
                        create: {
                            userId: user.id,
                            trackId: item.track.id,
                            trackName: item.track.name,
                            artistName: item.track.artists[0].name,
                            albumName: item.track.album.name,
                            genres: [], // We'll add genres later if needed
                            playedAt: new Date(item.played_at),
                            duration: item.track.duration_ms,
                        }
                    });
                }

                results.push({ 
                    userId: user.id, 
                    status: 'success',
                    tracksProcessed: data.items.length 
                });

            } catch (error) {
                console.error(`Failed to update history for user ${user.id}:`, error);
                results.push({ 
                    userId: user.id, 
                    status: 'error', 
                    error: error.message 
                });
            }
        }

        const duration = Date.now() - startTime;
        console.log(`
            History update completed:
            - Duration: ${duration}ms
            - Users processed: ${users.length}
            - Successful updates: ${results.filter(r => r.status === 'success').length}
            - Failed updates: ${results.filter(r => r.status === 'error').length}
        `);

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}