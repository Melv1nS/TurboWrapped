import { useState, useEffect } from 'react';

interface TrackingState {
  isEnabled: boolean;
  toggleTracking: () => void;
}

export function useTrackingState(): TrackingState {
  // Initialize state with null and set actual value after checking localStorage
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Only access localStorage during client-side execution
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spotifyTracking');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('spotifyTracking', JSON.stringify(isEnabled));
  }, [isEnabled]);

  const toggleTracking = () => {
    setIsEnabled(prev => !prev);
    // Add a slight delay before reloading to ensure localStorage is updated
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return {
    isEnabled,
    toggleTracking,
  };
}