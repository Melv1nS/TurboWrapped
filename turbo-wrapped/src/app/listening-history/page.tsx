'use client'
import { useSession } from "next-auth/react";
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import BackButton from '../components/BackButton';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type {
    TrackingPreferences,
    FilterStats,
    Filters,
    ListeningHistoryResponse
} from './types';

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

    const { data: trackingPrefs } = useSWR<TrackingPreferences>(
        session ? '/api/tracking-preferences' : null,
        fetcher
    );

    const { data, error, isLoading, isValidating } = useSWR<ListeningHistoryResponse>(
        session ? 
        `/api/listening-history?page=${page}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` 
        : null,
        fetcher
    );

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

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'playedAt',
        direction: 'desc',
    });

    const sortedHistory = useMemo(() => {
        if (!data?.history) return [];
        const sorted = [...data.history];
        sorted.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sorted;
    }, [data?.history, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const setQuickDateRange = (type: 'week' | 'month' | 'year') => {
        const now = new Date();
        let startDate;
        switch (type) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date();
        }
        setDateRange({
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        });
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
                <div className="flex gap-4 mb-4">
                    <button onClick={() => setQuickDateRange('week')} className="bg-spotify-green text-black px-3 py-1 rounded">Last Week</button>
                    <button onClick={() => setQuickDateRange('month')} className="bg-spotify-green text-black px-3 py-1 rounded">Last Month</button>
                    <button onClick={() => setQuickDateRange('year')} className="bg-spotify-green text-black px-3 py-1 rounded">Last Year</button>
                </div>
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm mb-1">Start Date</label>
                        <ReactDatePicker
                            selected={new Date(dateRange.startDate)}
                            onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date.toISOString().split('T')[0] }))}
                            className="bg-spotify-dark-grey rounded p-2"
                            disabled={isLoading || isValidating}
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">End Date</label>
                        <ReactDatePicker
                            selected={new Date(dateRange.endDate)}
                            onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date.toISOString().split('T')[0] }))}
                            className="bg-spotify-dark-grey rounded p-2"
                            disabled={isLoading || isValidating}
                            dateFormat="yyyy-MM-dd"
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
                        {/* History Table */}
                        <table className="min-w-full bg-spotify-dark-grey rounded-lg">
                            <thead>
                                <tr className="bg-[#1DB954] text-black">
                                    <th
                                        className="p-4 text-left cursor-pointer hover:text-gray-700"
                                        onClick={() => requestSort('trackName')}
                                    >
                                        Track Name
                                    </th>
                                    <th
                                        className="p-4 text-left cursor-pointer hover:text-gray-700"
                                        onClick={() => requestSort('artistName')}
                                    >
                                        Artist
                                    </th>
                                    <th
                                        className="p-4 text-left cursor-pointer hover:text-gray-700"
                                        onClick={() => requestSort('albumName')}
                                    >
                                        Album
                                    </th>
                                    <th
                                        className="p-4 text-left cursor-pointer hover:text-gray-700"
                                        onClick={() => requestSort('genres')}
                                    >
                                        Genres
                                    </th>
                                    <th
                                        className="p-4 text-left cursor-pointer hover:text-gray-700"
                                        onClick={() => requestSort('playedAt')}
                                    >
                                        Played At
                                    </th>
                                    <th
                                        className="p-4 text-left cursor-pointer hover:text-gray-700"
                                        onClick={() => requestSort('duration')}
                                    >
                                        Duration
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedHistory.map((item) => (
                                    <tr key={`${item.trackId}-${item.playedAt}`} className="hover:bg-opacity-70 transition-colors">
                                        <td className="p-4">{item.trackName}</td>
                                        <td className="p-4">{item.artistName}</td>
                                        <td className="p-4">{item.albumName}</td>
                                        <td className="p-4">{item.genres.join(', ')}</td>
                                        <td className="p-4">{formatDateTime(item.playedAt)}</td>
                                        <td className="p-4">{formatDuration(item.duration)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

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