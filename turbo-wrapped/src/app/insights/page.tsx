'use client';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { Heatmaps } from '../components/heatmaps/Heatmaps';
import { ArtistWorldMap } from '../components/ArtistWorldMap';
import LoadingSpinner from '../components/LoadingSpinner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Insights() {
    const router = useRouter();
    const { data: session } = useSession();

    const { data: listeningHistory, error: historyError, isLoading: historyLoading } = useSWR(
        session ? '/api/listening-history' : null,
        fetcher
    );

    const { data: locationData, error: locationError, isLoading: locationLoading } = useSWR(
        session ? '/api/artist-locations' : null,
        fetcher
    );

    if (!session) {
        return (
            <div className="p-6 text-center">
                <p>Please log in to view your insights.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-spotify-grey hover:text-white" />
                </button>
                <h2 className="text-2xl font-bold">Listening Insights</h2>
            </div>

            {/* Heatmap Card */}
            <div className="bg-spotify-dark-grey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Listening Patterns</h3>
                {historyError ? (
                    <div className="text-red-500 text-center p-4">
                        Failed to load listening history: {historyError.message}
                    </div>
                ) : historyLoading ? (
                    <div className="flex justify-center p-4">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <Heatmaps data={listeningHistory} />
                )}
            </div>

            {/* Artist Locations Card */}
            <div className="bg-spotify-dark-grey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Your Music's Global Reach</h3>
                {locationError ? (
                    <div className="text-red-500 text-center p-4">
                        Failed to load artist locations: {locationError.message}
                    </div>
                ) : locationLoading ? (
                    <div className="flex justify-center p-4">
                        <LoadingSpinner />
                    </div>
                ) : locationData?.locations?.length ? (
                    <div className="h-[600px] w-full">
                        <ArtistWorldMap locations={locationData.locations} />
                    </div>
                ) : (
                    <div className="text-center text-spotify-grey p-4">
                        No artist location data available yet.
                    </div>
                )}
            </div>
        </div>
    );
}