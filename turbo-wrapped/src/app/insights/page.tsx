'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import BackButton from '../components/BackButton';
import { formatDuration } from '../utils/formatters';
import { ListeningPatternHeatmap } from '../components/ListeningPatternHeatmap';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

export default function Insights() {
    const { data: session } = useSession();
    const { data: patternData, error, isLoading } = useSWR(
        session ? '/api/insights' : null,
        fetcher
    );

    if (!session) {
        return null;
    }

    if (error) {
        return <div className="text-red-500 p-4">Error loading insights: {error.message}</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <BackButton />
                <h2 className="text-2xl font-bold">Listening Insights</h2>
                <div className="w-[100px]" /> {/* Spacer for alignment */}
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="bg-spotify-dark-grey p-6 rounded-lg animate-pulse">
                        <div className="h-64 bg-spotify-light-grey/20 rounded" />
                    </div>
                ) : patternData && (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Total Plays</h3>
                                <p className="text-2xl font-bold">{patternData.stats.totalPlays}</p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Total Listening Time</h3>
                                <p className="text-2xl font-bold">
                                    {formatDuration(patternData.stats.totalDuration)}
                                </p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Peak Hour</h3>
                                <p className="text-2xl font-bold">
                                    {patternData.stats.peakListening.hour === 0 ? '12 AM' : 
                                     patternData.stats.peakListening.hour === 12 ? '12 PM' : 
                                     patternData.stats.peakListening.hour > 12 ? 
                                     `${patternData.stats.peakListening.hour - 12} PM` : 
                                     `${patternData.stats.peakListening.hour} AM`}
                                </p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Longest Streak</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold">
                                        {patternData.stats.streak.count} Days
                                    </p>
                                    {patternData.stats.streak.count > 0 && (
                                        <svg 
                                            className="w-5 h-5 text-spotify-green" 
                                            fill="currentColor" 
                                            viewBox="0 0 20 20"
                                        >
                                            <path 
                                                fillRule="evenodd" 
                                                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" 
                                                clipRule="evenodd" 
                                            />
                                        </svg>
                                    )}
                                </div>
                                {patternData.stats.streak.count > 0 && (
                                    <p className="text-xs text-spotify-grey mt-1">
                                        {patternData.stats.streak.startDay} - {patternData.stats.streak.endDay}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Heatmap */}
                        <ListeningPatternHeatmap data={patternData} />
                    </>
                )}
            </div>
        </div>
    );
}