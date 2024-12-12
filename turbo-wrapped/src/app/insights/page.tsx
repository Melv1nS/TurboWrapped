'use client';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../components/BackButton';
import { formatDuration } from '../utils/formatters';
import { ListeningPatternHeatmap } from '../components/ListeningPatternHeatmap';
import { ListeningDiversityScore } from '../components/ListeningDiversityScore';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

const getBadge = (score: number): { title: string; description: string } => {
    if (score >= 90) {
        return {
            title: 'Musical Explorer',
            description: 'Your listening habits are incredibly diverse!'
        };
    } else if (score >= 70) {
        return {
            title: 'Genre Hopper',
            description: 'You enjoy a wide variety of music!'
        };
    } else if (score >= 50) {
        return {
            title: 'Balanced Listener',
            description: 'You have a good mix of favorites and exploration.'
        };
    } else if (score >= 30) {
        return {
            title: 'Comfort Seeker',
            description: 'You know what you like and stick to it.'
        };
    } else {
        return {
            title: 'Focused Fan',
            description: "You're deeply passionate about specific music."
        };
    }
};

const calculateOverallScore = (data: DiversityMetrics): number => {
    const weights = {
        genreDiversity: 0.4,
        artistDiversity: 0.4,
        albumDiversity: 0.2,
    };

    return Math.round(
        Object.entries(data).reduce(
            (score, [key, value]) => score + value * weights[key as keyof DiversityMetrics] * 100,
            0
        )
    );
};

export default function Insights() {
    const { data: session } = useSession();
    const { data: patterns, error: patternsError, isLoading: patternsLoading } = useSWR(
        session ? '/api/heatmap' : null,
        fetcher
    );
    const { data: diversity, error: diversityError, isLoading: diversityLoading } = useSWR(
        session ? '/api/diversity' : null,
        fetcher
    );

    const isLoading = patternsLoading || diversityLoading;
    const error = patternsError || diversityError;

    if (!session) return null;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <BackButton />
                <h2 className="text-2xl font-bold">Listening Insights</h2>
                <div className="w-[100px]" /> {/* Spacer for alignment */}
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
                        {error.message || 'Failed to load insights'}
                    </motion.div>
                ) : isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Stats Cards Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="bg-spotify-dark-grey p-4 rounded-lg animate-pulse"
                                >
                                    <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                                    <div className="h-6 bg-white/10 rounded w-3/4" />
                                </div>
                            ))}
                        </div>

                        {/* Heatmap Skeleton */}
                        <div className="bg-spotify-dark-grey p-6 rounded-lg animate-pulse">
                            <div className="h-64 bg-white/10 rounded" />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative space-y-6"
                    >
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Total Plays</h3>
                                <p className="text-2xl font-bold">{patterns.stats.totalPlays}</p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Total Listening Time</h3>
                                <p className="text-2xl font-bold">
                                    {formatDuration(patterns.stats.totalDuration)}
                                </p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Peak Hour</h3>
                                <p className="text-2xl font-bold">
                                    {patterns.stats.peakListening.hour === 0 ? '12 AM' : 
                                     patterns.stats.peakListening.hour === 12 ? '12 PM' : 
                                     patterns.stats.peakListening.hour > 12 ? 
                                     `${patterns.stats.peakListening.hour - 12} PM` : 
                                     `${patterns.stats.peakListening.hour} AM`}
                                </p>
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Longest Streak</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold">
                                        {patterns.stats.streak.count} Days
                                    </p>
                                    {patterns.stats.streak.count > 0 && (
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
                                {patterns.stats.streak.count > 0 && (
                                    <p className="text-xs text-spotify-grey mt-1">
                                        {patterns.stats.streak.startDay} - {patterns.stats.streak.endDay}
                                    </p>
                                )}
                            </div>
                            <div className="bg-spotify-dark-grey p-4 rounded-lg">
                                <h3 className="text-sm text-spotify-grey">Diversity Score</h3>
                                <p className="text-2xl font-bold text-spotify-green">
                                    {calculateOverallScore(diversity.diversity)}%
                                </p>
                                <div className="mt-2">
                                    <div className="bg-[#282828] px-2 py-1 rounded-full inline-block">
                                        <span className="text-xs font-medium text-spotify-green">
                                            {getBadge(calculateOverallScore(diversity.diversity)).title}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Heatmap */}
                        <ListeningPatternHeatmap data={patterns} />
                        <div>
                            {/* Diversity Score */}
                            <ListeningDiversityScore data={diversity.diversity} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}