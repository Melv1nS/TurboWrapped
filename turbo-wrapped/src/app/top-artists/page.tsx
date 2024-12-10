'use client'
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Artist {
    id: string;
    name: string;
    images: Array<{
        url: string;
        height: number;
        width: number;
    }>;
    genres: string[];
}

export default function TopArtists() {
    const { data: session } = useSession();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTopArtists() {
            if (session) {
                try {
                    const response = await fetch('/api/artists');
                    if (!response.ok) {
                        throw new Error('Failed to fetch top artists');
                    }
                    const data = await response.json();
                    setArtists(data.items);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An error occurred');
                } finally {
                    setLoading(false);
                }
            }
        }

        fetchTopArtists();
    }, [session]);

    if (!session) {
        return null;
    }

    if (loading) {
        return <div className="text-center p-4">Loading your top artists...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>;
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Your Top Artists</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {artists.map((artist) => (
                    <div 
                        key={artist.id} 
                        className="flex flex-col items-center p-4 rounded-lg hover:bg-opacity-10 hover:bg-white transition-all"
                    >
                        <Image
                            src={artist.images[0]?.url}
                            alt={artist.name}
                            width={160}
                            height={160}
                            className="rounded-full mb-3"
                        />
                        <h3 className="text-lg font-semibold text-center">{artist.name}</h3>
                        <p className="text-sm opacity-70 text-center">
                            {artist.genres.slice(0, 2).join(', ')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
