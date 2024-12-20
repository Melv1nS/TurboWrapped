'use client'
import { useSession } from "next-auth/react";
import { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import BackButton from '../components/BackButton';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import type {
    TrackingPreferences,
    ListeningHistoryResponse
} from './types';
import { Heatmaps } from '../components/heatmaps/Heatmaps';
import LoadingSpinner from '../components/LoadingSpinner';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

export default function ListeningHistory() {
    const { data: session } = useSession();
    const [page, setPage] = useState(1);
    const [activeView, setActiveView] = useState<'table' | 'heatmap'>('table');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const { data: trackingPrefs } = useSWR<TrackingPreferences>(
        session ? '/api/tracking-preferences' : null,
        fetcher
    );

    const { data: filteredHistory, error: historyError, isLoading: historyLoading } = useSWR<ListeningHistoryResponse>(
        session ? `/api/listening-history?page=${page}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` : null,
        fetcher
    );

    const { data: heatmapData, error: heatmapError, isLoading: heatmapLoading } = useSWR<ListeningHistoryResponse>(
        session && activeView === 'heatmap' ? '/api/listening-history/heatmap' : null,
        fetcher
    );

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'playedAt',
        direction: 'desc',
    });

    const sortedHistory = useMemo(() => {
        if (!filteredHistory?.history) return [];
        const sorted = [...filteredHistory.history];
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
    }, [filteredHistory?.history, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
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
        <div className="p-6 space-y-6">
            <BackButton />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Listening History</h2>
                <div className="bg-spotify-dark-grey rounded-lg p-1">
                    <button
                        onClick={() => setActiveView('table')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            activeView === 'table' 
                                ? 'bg-spotify-green text-black' 
                                : 'text-white hover:bg-opacity-70'
                        }`}
                    >
                        Table View
                    </button>
                    <button
                        onClick={() => setActiveView('heatmap')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            activeView === 'heatmap' 
                                ? 'bg-spotify-green text-black' 
                                : 'text-white hover:bg-opacity-70'
                        }`}
                    >
                        Heatmap View
                    </button>
                </div>
            </div>

            {/* Date Range Filters - Only show in table view */}
            {activeView === 'table' && (
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
                                disabled={historyLoading}
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">End Date</label>
                            <ReactDatePicker
                                selected={new Date(dateRange.endDate)}
                                onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date.toISOString().split('T')[0] }))}
                                className="bg-spotify-dark-grey rounded p-2"
                                disabled={historyLoading}
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Conditional rendering based on activeView */}
            {activeView === 'heatmap' ? (
                <div className="bg-spotify-dark-grey rounded-lg p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                        {heatmapError ? (
                            <div className="text-red-500">Failed to load listening patterns</div>
                        ) : heatmapLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <Heatmaps data={heatmapData} />
                        )}
                    </Suspense>
                </div>
            ) : (
                <div className="bg-spotify-dark-grey rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">Listening History</h3>
                    <div className="bg-spotify-dark-grey rounded-lg overflow-hidden">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-[#1DB954] text-black">
                                    <th className="p-4 text-left cursor-pointer hover:text-gray-700" onClick={() => requestSort('playedAt')}>Played At</th>
                                    <th className="p-4 text-left cursor-pointer hover:text-gray-700" onClick={() => requestSort('trackName')}>Track Name</th>
                                    <th className="p-4 text-left cursor-pointer hover:text-gray-700" onClick={() => requestSort('artistName')}>Artist</th>
                                    <th className="p-4 text-left cursor-pointer hover:text-gray-700" onClick={() => requestSort('albumName')}>Album</th>
                                    <th className="p-4 text-left cursor-pointer hover:text-gray-700" onClick={() => requestSort('genres')}>Genres</th>
                                    <th className="p-4 text-left cursor-pointer hover:text-gray-700" onClick={() => requestSort('duration')}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedHistory.map((item) => (
                                    <tr key={`${item.trackId}-${item.playedAt}`} className="hover:bg-opacity-70 transition-colors">
                                        <td className="p-4">{formatDateTime(item.playedAt)}</td>
                                        <td className="p-4">{item.trackName}</td>
                                        <td className="p-4">{item.artistName}</td>
                                        <td className="p-4">{item.albumName}</td>
                                        <td className="p-4">{item.genres.join(', ')}</td>
                                        <td className="p-4">{formatDuration(item.duration)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1 || historyLoading}
                            className={`p-1 rounded ${
                                page === 1 
                                    ? 'bg-spotify-dark-grey text-spotify-grey cursor-not-allowed' 
                                    : 'bg-spotify-dark-grey text-white hover:bg-opacity-70'
                            }`}
                            aria-label="Previous page"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>

                        {filteredHistory?.pagination?.pages && Array.from({ length: filteredHistory.pagination.pages }, (_, i) => {
                            if (
                                i === 0 || // First page
                                i === filteredHistory.pagination.pages - 1 || // Last page
                                i === page - 1 || // Current page
                                i === page - 2 || // One before current
                                i === page // One after current
                            ) {
                                return (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`px-3 py-1 rounded min-w-[32px] ${
                                            page === i + 1 
                                                ? 'bg-spotify-green text-black' 
                                                : 'bg-spotify-dark-grey text-white hover:bg-opacity-70'
                                        }`}
                                        disabled={historyLoading}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            } else if (
                                i === 1 || // Show ellipsis after first page
                                i === filteredHistory.pagination.pages - 2 // Show ellipsis before last page
                            ) {
                                return <span key={`ellipsis-${i}`} className="text-spotify-grey">...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={!filteredHistory?.pagination?.pages || page === filteredHistory?.pagination?.pages || historyLoading}
                            className={`p-1 rounded ${
                                !filteredHistory?.pagination?.pages || page === filteredHistory?.pagination?.pages
                                    ? 'bg-spotify-dark-grey text-spotify-grey cursor-not-allowed'
                                    : 'bg-spotify-dark-grey text-white hover:bg-opacity-70'
                            }`}
                            aria-label="Next page"
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}