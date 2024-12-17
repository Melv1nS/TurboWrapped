import { NextResponse } from "next/server";
import prisma from '@/app/lib/prisma';
import { getOrCreateArtistLocation } from '@/app/utils/artistLocation';

export async function GET(request: Request) {
    // Verify the request is from GitHub Actions
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
        console.log('Unauthorized request received');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.$connect();
        console.log('Database connected successfully');

        const users = await prisma.user.findMany({
            where: { trackingEnabled: true },
            include: {
                accounts: {
                    where: { provider: 'spotify' }
                }
            }
        });
        console.log(`Found ${users.length} users with tracking enabled`);

        const results = [];
        
        for (const user of users) {
            const spotifyAccount = user.accounts[0];
            if (!spotifyAccount?.access_token) continue;

            try {
                // Add token refresh logic
                if (spotifyAccount.expires_at * 1000 < Date.now()) {
                    const response = await fetch('https://accounts.spotify.com/api/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            Authorization: `Basic ${Buffer.from(
                                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                            ).toString('base64')}`,
                        },
                        body: new URLSearchParams({
                            grant_type: 'refresh_token',
                            refresh_token: spotifyAccount.refresh_token!,
                        }),
                    });

                    const tokens = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(`Failed to refresh token: ${tokens.error}`);
                    }

                    // Update the account with new tokens
                    await prisma.account.update({
                        where: { id: spotifyAccount.id },
                        data: {
                            access_token: tokens.access_token,
                            expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
                            token_type: tokens.token_type,
                        },
                    });

                    // Update the access token for current execution
                    spotifyAccount.access_token = tokens.access_token;
                }

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
                    const artistId = item.track.artists[0].id;
                    
                    // Add this before the Promise.all
                    console.log(`Processing artist: ${item.track.artists[0].name} (${artistId})`);

                    // Process artist location in parallel with other operations
                    const [locationResult, artistResponse] = await Promise.all([
                        getOrCreateArtistLocation(artistId, item.track.artists[0].name),
                        // Fetch artist details to get genres
                        fetch(
                            `https://api.spotify.com/v1/artists/${artistId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${spotifyAccount.access_token}`,
                                },
                            }
                        )
                    ]);

                    const artistData = await artistResponse.json();
                    const genres = artistResponse.ok ? artistData.genres : [];

                    // Add this after the Promise.all
                    console.log(`Location result:`, locationResult);
                    console.log(`Artist genres:`, genres);

                    await prisma.listeningHistory.upsert({
                        where: {
                            userId_trackId_playedAt: {
                                userId: user.id,
                                trackId: item.track.id,
                                playedAt: new Date(item.played_at)
                            }
                        },
                        update: {
                            genres: genres // Update genres even if record exists
                        },
                        create: {
                            userId: user.id,
                            trackId: item.track.id,
                            trackName: item.track.name,
                            artistName: item.track.artists[0].name,
                            albumName: item.track.album.name,
                            genres: genres,
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

        return NextResponse.json({ success: true, results });

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
        console.log('Database disconnected');
    }
}