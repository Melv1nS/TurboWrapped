import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface TrackingState {
  isEnabled: boolean;
  toggleTracking: () => void;
}

interface TrackingPreferences {
  trackingEnabled: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

export function useTrackingState(): TrackingState {
  const { data, mutate } = useSWR<TrackingPreferences>('/api/tracking-preferences', fetcher);
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spotifyTracking');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Update local state when API data is fetched
  useEffect(() => {
    if (data) {
      setIsEnabled(data.trackingEnabled);
      localStorage.setItem('spotifyTracking', JSON.stringify(data.trackingEnabled));
    }
  }, [data]);

  const toggleTracking = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    localStorage.setItem('spotifyTracking', JSON.stringify(newState));
    
    try {
      await fetch('/api/tracking-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
      });
      await mutate(); // Revalidate the data
    } catch (error) {
      console.error('Failed to update tracking preferences:', error);
      // Revert state on error
      setIsEnabled(!newState);
      localStorage.setItem('spotifyTracking', JSON.stringify(!newState));
    }
  };

  return {
    isEnabled,
    toggleTracking,
  };
}