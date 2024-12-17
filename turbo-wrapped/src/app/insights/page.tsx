'use client';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { Suspense, lazy } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Fix lazy imports by using dynamic import with proper type handling
const Heatmaps = lazy(() => 
    import('../components/heatmaps/Heatmaps').then(mod => ({
        default: mod.Heatmaps
    }))
);

const ArtistWorldMap = lazy(() => 
    import('../components/ArtistWorldMap').then(mod => ({
        default: mod.ArtistWorldMap
    }))
);

// Implement SWR config for better caching
const swrConfig = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
};

const fetcher = (url: string) => 
    fetch(url, {
        headers: {
            'Cache-Control': 'max-age=3600'
        }
    }).then((res) => res.json());

export default function Insights() {
    const router = useRouter();
    const { data: session } = useSession();

    const { data: listeningHistory, error: historyError, isLoading: historyLoading } = useSWR(
        session ? '/api/listening-history' : null,
        fetcher,
        swrConfig
    );

    const { data: locationData, error: locationError, isLoading: locationLoading } = useSWR(
        session ? '/api/artist-locations' : null,
        fetcher,
        swrConfig
    );

    const userArtists = new Set(listeningHistory?.uniqueArtists || []);

    if (!session) {
        return (
            <div className="min-h-[200px] p-6 text-center">
                <p>Please log in to view your insights.</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 h-[48px]">
                <button
                    onClick={() => router.push('/')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-spotify-grey hover:text-white" />
                </button>
                <h2 className="text-2xl font-bold">Listening Insights</h2>
            </div>

            {/* Heatmap Card */}
            <div className="bg-spotify-dark-grey rounded-lg p-6 min-h-[400px]">
                <h3 className="text-xl font-bold mb-4">Listening Patterns</h3>
                <Suspense fallback={<LoadingSpinner />}>
                    {historyError ? (
                        <div className="text-red-500 text-center p-4">
                            Failed to load listening history
                        </div>
                    ) : historyLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <Heatmaps data={listeningHistory} />
                    )}
                </Suspense>
            </div>

            {/* Artist Locations Card */}
            <div className="bg-spotify-dark-grey rounded-lg p-6 min-h-[600px]">
                <h3 className="text-xl font-bold mb-4">Your Music's Global Reach</h3>
                <Suspense fallback={<LoadingSpinner />}>
                    {locationError ? (
                        <div className="text-red-500 text-center p-4">
                            Failed to load artist locations
                        </div>
                    ) : locationLoading ? (
                        <LoadingSpinner />
                    ) : locationData?.locations?.length ? (
                        <div className="h-[600px] w-full">
                            <ArtistWorldMap 
                                locations={locationData.locations} 
                                userArtists={userArtists}
                            />
                        </div>
                    ) : (
                        <div className="text-center text-spotify-grey p-4">
                            No artist location data available yet.
                        </div>
                    )}
                </Suspense>
            </div>
        </div>
    );
}