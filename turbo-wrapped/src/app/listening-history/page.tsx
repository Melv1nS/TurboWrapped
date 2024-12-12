'use client'
import { useSession } from "next-auth/react";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import BackButton from '../components/BackButton';
import type {
    ListeningHistoryItem,
    Stats,
    TrackingPreferences,
    FilterStats,
    Filters,
    ListeningHistoryResponse
} from './types';
import { FilterPanel } from '../components/FilterPanel';


const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

export default function ListeningHistory() {
    const { data: session } = useSession();
    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const { data: trackingPrefs, isLoading: prefsLoading } = useSWR<TrackingPreferences>(
        session ? '/api/tracking-preferences' : null,
        fetcher
    );

    const { data, error, isLoading, isValidating } = useSWR<ListeningHistoryResponse>(
        session ? 
        `/api/listening-history?page=${page}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` 
        : null,
        fetcher
    );

    const [filters, setFilters] = useState<Filters>({
        genres: [],
        artists: [],
        timeOfDay: [],
        daysOfWeek: [],
        duration: {
            min: 0,
            max: 600000 // 10 minutes default
        },
        searchQuery: ''
    });

    const { data: filterStats } = useSWR<FilterStats>(
        session ? '/api/filter-stats' : null,
        fetcher
    );

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (!session) return null;
    if (!trackingPrefs?.trackingEnabled) {
        return (
            <div className="p-6">
                <BackButton />
                <div className="text-center p-4">
                    <h2 className="text-2xl font-bold mb-4">Listening History Tracking Disabled</h2>
                    <p>Enable tracking in your settings to start recording your listening history.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <BackButton />
            <h2 className="text-2xl font-bold mb-6">Your Listening History</h2>
            
            {/* Date Range Filters */}
            <div className="mb-6">
                <p className="text-sm text-spotify-grey mb-2">Select date range (inclusive)</p>
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm mb-1">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="bg-spotify-dark-grey rounded p-2"
                            disabled={isLoading || isValidating}
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">End Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="bg-spotify-dark-grey rounded p-2"
                            disabled={isLoading || isValidating}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-red-500 p-4"
                    >
                        {error.message || 'Failed to load listening history'}
                    </motion.div>
                ) : isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {/* Stats Cards Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-spotify-dark-grey/50 p-4 rounded-lg animate-pulse h-24" />
                            ))}
                        </div>
                        
                        {/* History List Skeleton */}
                        {[...Array(5)].map((_, i) => (
                            <div 
                                key={i}
                                className="flex items-center gap-4 p-3 bg-spotify-dark-grey/50 rounded-lg animate-pulse"
                            >
                                <div className="flex-grow space-y-2">
                                    <div className="h-4 bg-white/10 rounded w-3/4" />
                                    <div className="h-3 bg-white/10 rounded w-1/2" />
                                </div>
                                <div className="text-right space-y-2">
                                    <div className="h-3 bg-white/10 rounded w-24" />
                                    <div className="h-3 bg-white/10 rounded w-16" />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative"
                    >
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Total Tracks</h3>
                                <p className="text-2xl font-bold">{data.stats.totalTracks}</p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Unique Tracks</h3>
                                <p className="text-2xl font-bold">{data.stats.uniqueTracks}</p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Unique Artists</h3>
                                <p className="text-2xl font-bold">{data.stats.uniqueArtists}</p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Total Listening Time</h3>
                                <p className="text-2xl font-bold">
                                    {Math.floor(data.stats.totalDuration._sum.duration / 3600000)}h {Math.floor((data.stats.totalDuration._sum.duration % 3600000) / 60000)}m
                                </p>
                            </div>
                        </div>

                        {/* History List */}
                        <div className="space-y-2">
                            {data.history
                                .filter(item => {
                                    // Apply filters
                                    if (filters.searchQuery) {
                                        const query = filters.searchQuery.toLowerCase();
                                        if (!item.trackName.toLowerCase().includes(query) &&
                                            !item.artistName.toLowerCase().includes(query)) {
                                            return false;
                                        }
                                    }

                                    if (filters.genres.length && 
                                        !filters.genres.some(g => item.genres.includes(g))) {
                                        return false;
                                    }

                                    if (filters.timeOfDay.length) {
                                        const hour = new Date(item.playedAt).getHours();
                                        const timeOfDay = 
                                            hour < 6 ? 'night' :
                                            hour < 12 ? 'morning' :
                                            hour < 18 ? 'afternoon' : 'evening';
                                        if (!filters.timeOfDay.includes(timeOfDay)) {
                                            return false;
                                        }
                                    }

                                    if (item.duration < filters.duration.min || 
                                        item.duration > filters.duration.max) {
                                        return false;
                                    }

                                    return true;
                                })
                                .map((item) => (
                                    <div 
                                        key={`${item.trackId}-${item.playedAt}`}
                                        className="flex items-center gap-4 p-3 bg-spotify-dark-grey rounded-lg hover:bg-opacity-70 transition-colors"
                                    >
                                        <div className="flex-grow">
                                            <h3 className="font-semibold">{item.trackName}</h3>
                                            <p className="text-sm text-spotify-grey">{item.artistName} • {item.albumName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-spotify-grey">{formatDateTime(item.playedAt)}</p>
                                            <p className="text-xs text-spotify-grey">{formatDuration(item.duration)}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-6 flex justify-center gap-2">
                            {data?.pagination.pages && Array.from({ length: data.pagination.pages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`px-3 py-1 rounded ${
                                        page === i + 1 
                                            ? 'bg-spotify-green text-black' 
                                            : 'bg-spotify-dark-grey text-white'
                                    }`}
                                    disabled={isValidating}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        {/* Loading Overlay */}
                        {isValidating && (
                            <motion.div 
                                className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="w-8 h-8 border-2 border-t-green-500 border-opacity-50 rounded-full animate-spin" />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom right loading indicator */}
            <AnimatePresence>
                {isValidating && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm flex items-center gap-2"
                    >
                        <div className="w-4 h-4 border-2 border-t-green-500 border-opacity-50 rounded-full animate-spin" />
                        <span>Updating...</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}