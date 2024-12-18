'use client';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { Suspense, lazy, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Fix lazy imports by using dynamic import with proper type handling
const Heatmaps = lazy(() => 
    import('../components/heatmaps/Heatmaps').then(mod => ({
        default: mod.Heatmaps
    }))
);

const ArtistWorldMap = lazy(() => 
    import('../components/charts/ArtistWorldMap').then(mod => ({
        default: mod.ArtistWorldMap
    }))
);

const PersonalityInsights = lazy(() => 
    import('../components/PersonalityInsights').then(mod => ({
        default: mod.PersonalityInsights
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
    const { data: session, status } = useSession();
    const router = useRouter();

    // Handle authentication with useEffect
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

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

    const { data: personalityData, error: personalityError, isLoading: personalityLoading } = useSWR(
        session ? '/api/personality-insights' : null,
        fetcher
    );

    // Add logging to debug
    console.log("Personality Data:", personalityData);
    console.log("Personality Error:", personalityError);
    console.log("Personality Loading:", personalityLoading);

    const userArtists = new Set(listeningHistory?.uniqueArtists || []);

    // Show loading state while checking authentication
    if (status === 'loading') {
        return <LoadingSpinner />;
    }

    // Don't render content until we confirm authentication
    if (!session) {
        return null;
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

            {/* Personality Card */}
            <div className="bg-spotify-dark-grey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Your Music Personality</h3>
                <Suspense fallback={<LoadingSpinner />}>
                    {personalityError ? (
                        <div className="text-red-500 text-center p-4">
                            Failed to load personality insights: {personalityError.message}
                        </div>
                    ) : personalityLoading ? (
                        <LoadingSpinner />
                    ) : personalityData ? (
                        <PersonalityInsights data={personalityData} />
                    ) : (
                        <div className="text-center text-spotify-grey p-4">
                            Not enough listening history yet.
                        </div>
                    )}
                </Suspense>
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