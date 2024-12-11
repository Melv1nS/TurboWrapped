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

    // Add these utility functions
    const calculateTrackStats = (tracks: Track[]) => {
        const stats = {
            // Time-based stats
            averageDuration: Math.round(tracks.reduce((sum, track) => sum + track.duration_ms, 0) / tracks.length / 1000), // in seconds
            totalDuration: tracks.reduce((sum, track) => sum + track.duration_ms, 0), // in ms
            
            // Release date analysis
            averageReleaseYear: calculateAverageYear(tracks),
            yearRange: calculateYearRange(tracks),
            decadeDistribution: calculateDecadeDistribution(tracks),
            
            // Artist analysis
            uniqueArtistsCount: countUniqueArtists(tracks),
            artistAppearances: calculateArtistAppearances(tracks),
            averageArtistsPerTrack: Number((tracks.reduce((sum, track) => sum + track.artists.length, 0) / tracks.length).toFixed(2)),
            
            // Album analysis
            uniqueAlbumsCount: new Set(tracks.map(track => track.album.name)).size,
            albumAppearances: calculateAlbumAppearances(tracks),
        };

        return stats;
    };

    const calculateAverageYear = (tracks: Track[]) => {
        return Math.round(
            tracks.reduce((sum, track) => sum + new Date(track.album.release_date).getFullYear(), 0) / tracks.length
        );
    };

    const calculateYearRange = (tracks: Track[]) => {
        const years = tracks.map(track => new Date(track.album.release_date).getFullYear());
        return {
            oldest: Math.min(...years),
            newest: Math.max(...years),
        };
    };

    const calculateDecadeDistribution = (tracks: Track[]) => {
        const decades: { [key: string]: number } = {};
        tracks.forEach(track => {
            const year = new Date(track.album.release_date).getFullYear();
            const decade = Math.floor(year / 10) * 10;
            decades[`${decade}s`] = (decades[`${decade}s`] || 0) + 1;
        });
        return decades;
    };

    const countUniqueArtists = (tracks: Track[]) => {
        return new Set(tracks.flatMap(track => track.artists.map(artist => artist.id))).size;
    };

    const calculateArtistAppearances = (tracks: Track[]) => {
        const appearances: { [key: string]: number } = {};
        tracks.forEach(track => {
            track.artists.forEach(artist => {
                appearances[artist.name] = (appearances[artist.name] || 0) + 1;
            });
        });
        return Object.entries(appearances)
            .sort(([,a], [,b]) => b - a)
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    };

    const calculateAlbumAppearances = (tracks: Track[]) => {
        const appearances: { [key: string]: number } = {};
        tracks.forEach(track => {
            appearances[track.album.name] = (appearances[track.album.name] || 0) + 1;
        });
        return Object.entries(appearances)
            .sort(([,a], [,b]) => b - a)
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    };

    const stats = calculateTrackStats(tracks);

    return (
        <div className="p-6 bg-spotify-black min-h-screen">
            <div className="flex justify-between items-center mb-6">
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
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-spotify-dark-grey p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-spotify-white">Top Artists</h3>
                    <div className="space-y-2">
                        {Object.entries(artistFrequency)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([artist, count]) => (
                                <div key={artist} className="flex justify-between items-center">
                                    <span className="truncate text-spotify-white">{artist}</span>
                                    <span className="text-sm text-spotify-grey">{count} tracks</span>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="bg-spotify-dark-grey p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-spotify-white">Top Albums</h3>
                    <div className="space-y-2">
                        {Object.entries(albumDistribution)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([album, count]) => (
                                <div key={album} className="flex justify-between items-center">
                                    <span className="truncate text-spotify-white">{album}</span>
                                    <span className="text-sm text-spotify-grey">{count} tracks</span>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="bg-spotify-dark-grey p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-spotify-white">Release Years</h3>
                    <div className="space-y-2">
                        {Object.entries(yearDistribution)
                            .sort(([a], [b]) => Number(b) - Number(a))
                            .slice(0, 5)
                            .map(([year, count]) => (
                                <div key={year} className="flex justify-between items-center">
                                    <span className="text-spotify-white">{year}</span>
                                    <span className="text-sm text-spotify-grey">{count} tracks</span>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="bg-spotify-dark-grey p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-spotify-white">Playlist Stats</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-spotify-white">Average Duration</span>
                            <span className="text-sm text-spotify-grey">{formatDuration(stats.averageDuration * 1000)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-spotify-white">Total Duration</span>
                            <span className="text-sm text-spotify-grey">{formatTotalDuration(stats.totalDuration)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-spotify-white">Average Release Year</span>
                            <span className="text-sm text-spotify-grey">{stats.averageReleaseYear}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-spotify-white">Year Range</span>
                            <span className="text-sm text-spotify-grey">{stats.yearRange.oldest} - {stats.yearRange.newest}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-spotify-white">Artists per Track</span>
                            <span className="text-sm text-spotify-grey">{stats.averageArtistsPerTrack}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-spotify-white">Unique Artists</span>
                            <span className="text-sm text-spotify-grey">{stats.uniqueArtistsCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-spotify-white">Unique Albums</span>
                            <span className="text-sm text-spotify-grey">{stats.uniqueAlbumsCount}</span>
                        </div>
                    </div>
                </div>
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
