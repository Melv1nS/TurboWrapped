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
        release_date: string;
    };
    duration_ms: number;
}

interface AlbumCount {
    [key: string]: number;
}

interface ArtistCount {
    [key: string]: number;
}

interface YearCount {
    [key: string]: number;
}

export default function TopTracks() {
    const { data: session } = useSession();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('medium_term');
    const [albumDistribution, setAlbumDistribution] = useState<AlbumCount>({});
    const [artistFrequency, setArtistFrequency] = useState<ArtistCount>({});
    const [yearDistribution, setYearDistribution] = useState<YearCount>({});
    const [totalDuration, setTotalDuration] = useState(0);

    useEffect(() => {
        async function fetchTopTracks() {
            if (session) {
                try {
                    const response = await fetch(`/api/tracks?time_range=${timeRange}`);
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch data');
                    }

                    const tracksData = await response.json();
                    setTracks(tracksData.items);
                    
                    // Calculate distributions
                    const albumCounts: AlbumCount = {};
                    const artistCounts: ArtistCount = {};
                    const yearCounts: YearCount = {};
                    let duration = 0;

                    tracksData.items.forEach((track: Track) => {
                        // Album distribution
                        const albumKey = track.album.name;
                        albumCounts[albumKey] = (albumCounts[albumKey] || 0) + 1;

                        // Artist frequency
                        track.artists.forEach(artist => {
                            artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;
                        });

                        // Year distribution
                        const year = track.album.release_date.substring(0, 4);
                        yearCounts[year] = (yearCounts[year] || 0) + 1;

                        // Total duration
                        duration += track.duration_ms;
                    });

                    setAlbumDistribution(albumCounts);
                    setArtistFrequency(artistCounts);
                    setYearDistribution(yearCounts);
                    setTotalDuration(duration);

                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An error occurred');
                } finally {
                    setLoading(false);
                }
            }
        }

        fetchTopTracks();
    }, [session, timeRange]);

    // Format total duration
    const formatTotalDuration = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Top Tracks</h2>
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
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-opacity-10 bg-white p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Top Artists</h3>
                    <div className="space-y-2">
                        {Object.entries(artistFrequency)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([artist, count]) => (
                                <div key={artist} className="flex justify-between items-center">
                                    <span className="truncate">{artist}</span>
                                    <span className="text-sm opacity-70">{count} tracks</span>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="bg-opacity-10 bg-white p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Top Albums</h3>
                    <div className="space-y-2">
                        {Object.entries(albumDistribution)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([album, count]) => (
                                <div key={album} className="flex justify-between items-center">
                                    <span className="truncate">{album}</span>
                                    <span className="text-sm opacity-70">{count} tracks</span>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="bg-opacity-10 bg-white p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Release Years</h3>
                    <div className="space-y-2">
                        {Object.entries(yearDistribution)
                            .sort(([a], [b]) => Number(b) - Number(a))
                            .slice(0, 5)
                            .map(([year, count]) => (
                                <div key={year} className="flex justify-between items-center">
                                    <span>{year}</span>
                                    <span className="text-sm opacity-70">{count} tracks</span>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="bg-opacity-10 bg-white p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3">Playlist Stats</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span>Total Duration</span>
                            <span className="text-sm opacity-70">{formatTotalDuration(totalDuration)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Total Tracks</span>
                            <span className="text-sm opacity-70">{tracks.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Unique Artists</span>
                            <span className="text-sm opacity-70">{Object.keys(artistFrequency).length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Unique Albums</span>
                            <span className="text-sm opacity-70">{Object.keys(albumDistribution).length}</span>
                        </div>
                    </div>
                </div>
            </div>
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
