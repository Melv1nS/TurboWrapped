'use client'
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import BackButton from '../components/BackButton';
import TagCloud from '../components/charts/TagCloud';

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
  const [viewMode, setViewMode] = useState<'cloud' | 'list'>('cloud');

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
      <div className="flex flex-col items-center mb-6">
        <div className="w-full flex justify-between items-center mb-2">
          <BackButton />
          <div className="flex gap-4">
            <button
              onClick={() => setViewMode(viewMode === 'cloud' ? 'list' : 'cloud')}
              className="bg-opacity-10 bg-white rounded-md p-2 text-sm"
              disabled={isLoading || isValidating}
            >
              {viewMode === 'cloud' ? 'Show List' : 'Show Cloud'}
            </button>
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
        </div>
        <h2 className="text-2xl font-bold">Your Top Genres</h2>
        <div className="text-sm text-gray-400 mt-2">
          Based on the artists of your most played tracks
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
            {genres && viewMode === 'cloud' && <TagCloud genres={genres} />}
            {genres && viewMode === 'list' && (
              <div className="grid gap-3 max-w-3xl mx-auto">
                {genres.sort((a, b) => b.count - a.count).map((genre, index) => {
                  const totalTracks = genres.reduce((sum, g) => sum + g.count, 0);
                  const percentage = (genre.count / totalTracks) * 100;
                  
                  return (
                    <motion.div 
                      key={genre.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative overflow-hidden bg-white/5 hover:bg-white/10 
                                 transition-colors duration-300 p-4 rounded-lg"
                    >
                      <motion.div
                        className="absolute left-0 top-0 h-full bg-white/5"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                      />
                      
                      <div className="relative flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-medium text-lg">{genre.name}</span>
                          <span className="text-sm text-gray-400">
                            {genre.count} {genre.count === 1 ? 'track' : 'tracks'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-300">
                            {percentage.toFixed(1)}%
                          </span>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-green-500' :
                              index === 1 ? 'bg-green-400' :
                              index === 2 ? 'bg-green-300' :
                              'bg-green-200/50'
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            
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