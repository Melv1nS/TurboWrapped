'use client'
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Track {
    id: string;
    name: string;
    artists: Array<{
        id: string;
        name: string;
    }>;
    album: {
        name: string;
        images: Array<{
            url: string;
            height: number;
            width: number;
        }>;
    };
    duration_ms: number;
}

export default function TopTracks() {
    const { data: session } = useSession();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTopTracks() {
            if (session) {
                try {
                    const response = await fetch('/api/tracks');
                    if (!response.ok) {
                        throw new Error('Failed to fetch top tracks');
                    }
                    const data = await response.json();
                    setTracks(data.items);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An error occurred');
                } finally {
                    setLoading(false);
                }
            }
        }

        fetchTopTracks();
    }, [session]);

    if (!session) {
        return null;
    }

    if (loading) {
        return <div className="text-center p-4">Loading your top tracks...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>;
    }

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Your Top Tracks</h2>
            <div className="space-y-4">
                {tracks.map((track, index) => (
                    <div 
                        key={track.id}
                        className="flex items-center space-x-4 p-3 rounded-lg hover:bg-opacity-10 hover:bg-white transition-all"
                    >
                        <span className="w-6 text-opacity-50 text-white">
                            {index + 1}
                        </span>
                        <Image
                            src={track.album.images[0]?.url}
                            alt={track.album.name}
                            width={50}
                            height={50}
                            className="rounded-md"
                        />
                        <div className="flex-grow">
                            <h3 className="font-semibold">{track.name}</h3>
                            <p className="text-sm opacity-70">
                                {track.artists.map(artist => artist.name).join(', ')}
                            </p>
                        </div>
                        <div className="text-sm opacity-70">
                            {formatDuration(track.duration_ms)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
