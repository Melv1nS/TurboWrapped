'use client'
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  const { data: genres, error, isLoading } = useSWR<Genre[]>(
    session ? `/api/genres?time_range=${timeRange}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  if (!session) return null;
  
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500 p-4">
          {error.message || 'Failed to load genres from your top tracks'}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center p-4">
          Loading genres from your top tracks...
        </div>
      </div>
    );
  }

  if (!genres || genres.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center p-4">
          No genres found in your top tracks.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <BackButton />
        <h2 className="text-2xl font-bold">Your Top Genres</h2>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-opacity-10 bg-white rounded-md p-2 text-sm"
        >
          <option value="short_term">Last Month's Tracks</option>
          <option value="medium_term">6 Months of Tracks</option>
          <option value="long_term">All Time Tracks</option>
        </select>
      </div>

      <div className="text-sm text-gray-400 text-center mb-4">
        Based on the artists of your most played tracks
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-[400px]"
      >
        <TagCloud genres={genres} />
      </motion.div>
    </div>
  );
}