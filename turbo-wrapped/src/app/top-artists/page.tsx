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
    followers: {
        total: number
    };
    popularity: number;
    external_urls: {
        spotify: string;
    };
}

const calculateAveragePopularity = (artists: Artist[]) => {
    return Math.round(artists.reduce((sum, artist) => sum + artist.popularity, 0) / artists.length);
};

const calculateAverageFollowers = (artists: Artist[]) => {
    return Math.round(artists.reduce((sum, artist) => sum + artist.followers.total, 0) / artists.length);
};

const getMostCommonGenres = (artists: Artist[], limit = 5) => {
    const genreCounts = artists.flatMap(artist => artist.genres)
        .reduce((acc, genre) => {
            acc[genre] = (acc[genre] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    
    return Object.entries(genreCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([genre]) => genre);
};

export default function TopArtists() {
    const { data: session } = useSession();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('medium_term');

    useEffect(() => {
        async function fetchTopArtists() {
            if (session) {
                try {
                    const response = await fetch(`/api/artists?time_range=${timeRange}`);
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
    }, [session, timeRange]);

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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Top Artists</h2>
                <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-opacity-10 bg-white rounded-md p-2 text-sm"
                >
                    <option value="short_term">Last 4 Weeks</option>
                    <option value="medium_term">Last 6 Months</option>
                    <option value="long_term">All Time</option>
                </select>
            </div>
            <div className="mb-8 bg-opacity-10 bg-white rounded-lg p-4">
                <h3 className="text-xl font-semibold mb-3">Your Music Taste in Numbers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-sm opacity-70">Average Artist Popularity</p>
                        <p className="text-2xl font-bold text-green-500">{calculateAveragePopularity(artists)}%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm opacity-70">Average Followers</p>
                        <p className="text-2xl font-bold text-green-500">
                            {new Intl.NumberFormat().format(calculateAverageFollowers(artists))}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm opacity-70">Top Genres</p>
                        <p className="text-sm font-medium text-green-500">
                            {getMostCommonGenres(artists, 3).join(', ')}
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {artists.map((artist, index) => (
                    <div 
                        key={artist.id} 
                        className="flex flex-col items-center p-4 rounded-lg hover:bg-opacity-10 hover:bg-white transition-all"
                    >
                        <div className="relative">
                            <Image
                                src={artist.images[0]?.url}
                                alt={artist.name}
                                width={160}
                                height={160}
                                className="rounded-full mb-3"
                            />
                            <div className="absolute -top-2 -left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="font-bold text-sm">#{index + 1}</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-center">{artist.name}</h3>
                        
                        {/* Popularity Bar */}
                        <div className="w-full mt-2 mb-1">
                            <div className="text-xs mb-1">Popularity: {artist.popularity}%</div>
                            <div className="w-full bg-gray-700 h-2 rounded-full">
                                <div 
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${artist.popularity}%` }}
                                />
                            </div>
                        </div>

                        {/* Followers */}
                        <p className="text-sm opacity-70">
                            {new Intl.NumberFormat().format(artist.followers.total)} followers
                        </p>

                        {/* Genres with expand/collapse */}
                        <details className="mt-2 text-center">
                            <summary className="text-sm opacity-70 cursor-pointer">
                                {artist.genres.slice(0, 2).join(', ')}
                                {artist.genres.length > 2 && ' ...'}
                            </summary>
                            <p className="text-sm opacity-70 mt-1">
                                {artist.genres.join(', ')}
                            </p>
                        </details>

                        {/* Spotify Link */}
                        <a 
                            href={artist.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 text-xs text-green-500 hover:text-green-400"
                        >
                            Open in Spotify
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
