'use client'
import { useSession } from 'next-auth/react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import BackButton from '../components/BackButton';

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
        release_date: string;
    };
    duration_ms: number;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

export default function TopTracks() {
    const { data: session } = useSession();
    const [timeRange, setTimeRange] = useState('medium_term');

    const { data, error } = useSWR<{ items: Track[] }>(
        session ? `/api/tracks?time_range=${timeRange}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 300000, // 5 minutes
        }
    );

    const tracks = data?.items ?? [];

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!session) {
        return null;
    }

    if (!data) {
        return (
            <div className="p-6 bg-spotify-black min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <BackButton />
                    <h2 className="text-2xl font-bold text-spotify-white">Your Top Tracks</h2>
                    <div className="w-32 h-10 bg-spotify-dark-grey animate-pulse rounded-md" />
                </div>

                {/* Tracks List Skeleton */}
                <div className="space-y-4">
                    {[...Array(20)].map((_, i) => (
                        <div 
                            key={i}
                            className="flex items-center space-x-4 p-3 rounded-lg bg-spotify-dark-grey/20"
                        >
                            <div className="w-6 h-4 bg-spotify-dark-grey animate-pulse rounded" />
                            <div className="w-[50px] h-[50px] bg-spotify-dark-grey animate-pulse rounded-md" />
                            <div className="flex-grow">
                                <div className="w-48 h-5 bg-spotify-dark-grey animate-pulse rounded mb-2" />
                                <div className="w-32 h-4 bg-spotify-dark-grey animate-pulse rounded" />
                            </div>
                            <div className="w-12 h-4 bg-spotify-dark-grey animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error.message}</div>;
    }

    return (
        <div className="p-6 bg-spotify-black min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <BackButton />
                <h2 className="text-2xl font-bold text-spotify-white">Your Top Tracks</h2>
                <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-spotify-dark-grey text-spotify-white rounded-md p-2 text-sm border-none focus:ring-2 focus:ring-spotify-green"
                >
                    <option value="short_term">Last 4 Weeks</option>
                    <option value="medium_term">Last 6 Months</option>
                    <option value="long_term">All Time</option>
                </select>
            </div>
            <div className="space-y-4">
                {tracks.map((track, index) => (
                    <div 
                        key={track.id}
                        className="flex items-center space-x-4 p-3 rounded-lg hover:bg-spotify-dark-grey transition-all"
                    >
                        <span className="w-6 text-spotify-grey">
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
                            <h3 className="font-semibold text-spotify-white">{track.name}</h3>
                            <p className="text-sm text-spotify-grey">
                                {track.artists.map(artist => artist.name).join(', ')}
                            </p>
                        </div>
                        <div className="text-sm text-spotify-grey">
                            {formatDuration(track.duration_ms)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
