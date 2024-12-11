'use client'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TrackingToggle() {
    const { data: session } = useSession();
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        // Fetch initial tracking status
        const fetchTrackingStatus = async () => {
            try {
                const response = await fetch('/api/user/tracking-preferences');
                if (response.ok) {
                    const data = await response.json();
                    setIsTracking(data.trackingEnabled);
                }
            } catch (error) {
                console.error('Failed to fetch tracking status:', error);
            }
        };

        if (session) {
            fetchTrackingStatus();
        }
    }, [session]);

    const toggleTracking = async () => {
        try {
            const response = await fetch('/api/tracking-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !isTracking }),
            });

            if (response.ok) {
                setIsTracking(!isTracking);
            }
        } catch (error) {
            console.error('Failed to update tracking preferences:', error);
        }
    };

    return (
        <div className="mt-4 bg-spotify-dark-grey p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Listening History Tracking</h3>
            <p className="text-sm text-spotify-grey mb-4">
                Enable to track your Spotify listening history every 4 hours
            </p>
            <label className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={isTracking}
                    onChange={toggleTracking}
                    className="form-checkbox"
                />
                <span>Enable tracking</span>
            </label>
        </div>
    );
}