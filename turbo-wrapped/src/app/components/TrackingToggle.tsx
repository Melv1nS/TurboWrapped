'use client'
import { useTrackingState } from '../hooks/useTrackingState';

export default function TrackingToggle() {
  const { isEnabled, toggleTracking } = useTrackingState();
  
  return (
    <div className="bg-spotify-dark-elevated p-6 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold mb-1">Listening History</h3>
          <p className="text-sm text-gray-300">
            {isEnabled ? 'Currently tracking' : 'Tracking disabled'}
          </p>
        </div>
        <button
          onClick={toggleTracking}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                     ${isEnabled ? 'bg-spotify-green' : 'bg-gray-600'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                       ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </div>
  );
}