'use client'
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import BackButton from '../components/BackButton';
import TagCloud from '../components/TagCloud';

interface Genre {
  name: string;
  count: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

export default function TopGenres() {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState('medium_term');

  const { data: genres, error, isLoading, isValidating } = useSWR<Genre[]>(
    session ? `/api/genres?time_range=${timeRange}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  if (!session) return null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <BackButton />
        <h2 className="text-2xl font-bold">Your Top Genres</h2>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-opacity-10 bg-white rounded-md p-2 text-sm"
          disabled={isLoading || isValidating}
        >
          <option value="short_term">Last Month's Tracks</option>
          <option value="medium_term">6 Months of Tracks</option>
          <option value="long_term">All Time Tracks</option>
        </select>
      </div>

      <div className="text-sm text-gray-400 text-center mb-4">
        Based on the artists of your most played tracks
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
            {error.message || 'Failed to load genres from your top tracks'}
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[500px] flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-t-green-500 border-opacity-50 rounded-full animate-spin mb-4" />
            <p className="text-gray-300">Analyzing your music taste...</p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-[500px]"
          >
            {genres && <TagCloud genres={genres} />}
            
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