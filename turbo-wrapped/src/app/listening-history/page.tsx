'use client'
import { useSession } from "next-auth/react";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import BackButton from '../components/BackButton';

interface ListeningHistoryItem {
    trackId: string;
    trackName: string;
    artistName: string;
    albumName: string;
    playedAt: string;
    duration: number;
}

interface Stats {
    totalTracks: number;
    uniqueTracks: number;
    uniqueArtists: number;
    totalDuration: {
        _sum: {
            duration: number;
        }
    };
}

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

    const { data, error, isLoading } = useSWR(
        session ? 
        `/api/listening-history?page=${page}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` 
        : null,
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
    if (error) return <div className="text-center text-red-500 p-4">{error.message}</div>;
    if (isLoading) return <div className="text-center p-4">Loading your listening history...</div>;

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
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">End Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="bg-spotify-dark-grey rounded p-2"
                        />
                    </div>
                </div>
            </div>

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
                {data.history.map((item: ListeningHistoryItem) => (
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
                {Array.from({ length: data.pagination.pages }, (_, i) => (
                    <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={`px-3 py-1 rounded ${
                            page === i + 1 
                                ? 'bg-spotify-green text-black' 
                                : 'bg-spotify-dark-grey text-white'
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}