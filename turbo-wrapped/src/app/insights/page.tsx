'use client';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { Suspense, lazy, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { ListeningStats } from '../components/ListeningStats';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Lazy load components
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

// SWR configuration
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

interface DateRange {
    startDate: string;
    endDate: string;
}

// Add this custom style for the date picker
const datePickerStyles = `
    bg-spotify-darker-grey 
    text-white 
    px-4 
    py-2 
    rounded-lg 
    border 
    border-spotify-grey/20
    focus:outline-none 
    focus:border-spotify-green 
    hover:border-spotify-grey/40
    transition-colors
`;

export default function Insights() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    // Data fetching with date range filtering
    const { data: listeningHistory, error: historyError, isLoading: historyLoading } = useSWR(
        session ? `/api/listening-history?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` : null,
        fetcher,
        swrConfig
    );

    const { data: locationData, error: locationError, isLoading: locationLoading } = useSWR(
        session ? `/api/artist-locations?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` : null,
        fetcher,
        swrConfig
    );

    const { data: personalityData, error: personalityError, isLoading: personalityLoading } = useSWR(
        session ? `/api/personality-insights?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` : null,
        fetcher,
        swrConfig
    );

    const userArtists = new Set(listeningHistory?.uniqueArtists || []);

    // Quick date range setters
    const setQuickDateRange = (type: 'week' | 'month' | 'year' | 'all') => {
        const now = new Date();
        let startDate;
        switch (type) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            case 'all':
                startDate = new Date('2000-01-01'); // Far back enough to cover all possible history
                break;
            default:
                startDate = new Date();
        }
        setDateRange({
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        });
    };

    if (status === 'loading') return <LoadingSpinner />;
    if (!session) return null;

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

            {/* Description */}
            <p className="text-spotify-grey text-sm">
                All insights shown below are based on your listening activity during the selected date range. 
                Adjust the dates to explore how your music taste and listening habits have evolved over time.
            </p>

            {/* Date Range Filters - Updated Design */}
            <div className="bg-spotify-dark-grey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Date Range</h3>
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                        <label className="block text-sm text-spotify-grey mb-2">Start Date</label>
                        <ReactDatePicker
                            selected={new Date(dateRange.startDate)}
                            onChange={(date) => setDateRange(prev => ({ 
                                ...prev, 
                                startDate: date.toISOString().split('T')[0] 
                            }))}
                            className={datePickerStyles}
                            dateFormat="yyyy-MM-dd"
                            maxDate={new Date(dateRange.endDate)}
                            placeholderText="Select start date"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm text-spotify-grey mb-2">End Date</label>
                        <ReactDatePicker
                            selected={new Date(dateRange.endDate)}
                            onChange={(date) => setDateRange(prev => ({ 
                                ...prev, 
                                endDate: date.toISOString().split('T')[0] 
                            }))}
                            className={datePickerStyles}
                            dateFormat="yyyy-MM-dd"
                            minDate={new Date(dateRange.startDate)}
                            maxDate={new Date()}
                            placeholderText="Select end date"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                        />
                    </div>
                </div>
                {/* Quick select buttons */}
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={() => setQuickDateRange('week')}
                        className="px-4 py-2 text-sm rounded-full bg-spotify-darker-grey hover:bg-spotify-grey/20 transition-colors"
                    >
                        Last Week
                    </button>
                    <button 
                        onClick={() => setQuickDateRange('month')}
                        className="px-4 py-2 text-sm rounded-full bg-spotify-darker-grey hover:bg-spotify-grey/20 transition-colors"
                    >
                        Last Month
                    </button>
                    <button 
                        onClick={() => setQuickDateRange('year')}
                        className="px-4 py-2 text-sm rounded-full bg-spotify-darker-grey hover:bg-spotify-grey/20 transition-colors"
                    >
                        Last Year
                    </button>
                    <button 
                        onClick={() => setQuickDateRange('all')}
                        className="px-4 py-2 text-sm rounded-full bg-spotify-darker-grey hover:bg-spotify-grey/20 transition-colors"
                    >
                        All Time
                    </button>
                </div>
            </div>

            {/* Listening Stats */}
            <div className="bg-spotify-dark-grey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Listening Statistics</h3>
                <Suspense fallback={<LoadingSpinner />}>
                    {historyError ? (
                        <div className="text-red-500 text-center p-4">
                            Failed to load listening history
                        </div>
                    ) : historyLoading ? (
                        <LoadingSpinner />
                    ) : listeningHistory?.history?.length ? (
                        <ListeningStats data={listeningHistory} />
                    ) : (
                        <div className="text-center text-spotify-grey p-4">
                            No listening history available for this period.
                        </div>
                    )}
                </Suspense>
            </div>

            {/* Personality Insights */}
            <div className="bg-spotify-dark-grey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Your Music Personality</h3>
                <Suspense fallback={<LoadingSpinner />}>
                    {personalityError ? (
                        <div className="text-red-500 text-center p-4">
                            Failed to load personality insights
                        </div>
                    ) : personalityLoading ? (
                        <LoadingSpinner />
                    ) : personalityData ? (
                        <PersonalityInsights data={personalityData} />
                    ) : (
                        <div className="text-center text-spotify-grey p-4">
                            Not enough listening history for this period.
                        </div>
                    )}
                </Suspense>
            </div>

            {/* Global Reach */}
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
                            No artist location data available for this period.
                        </div>
                    )}
                </Suspense>
            </div>
        </div>
    );
}