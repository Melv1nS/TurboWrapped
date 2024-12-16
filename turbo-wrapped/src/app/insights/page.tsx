'use client';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Heatmaps } from '@/app/components/heatmaps/Heatmaps';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
};

const LoadingSpinner = () => (
    <div className="flex items-center justify-center w-full h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-spotify-green"></div>
        <span className="sr-only">Loading...</span>
    </div>
);

export default function Insights() {
    const router = useRouter();
    const { data: session } = useSession();

    const { data: listeningHistory, error, isLoading } = useSWR(
        session ? '/api/listening-history' : null,
        fetcher
    );

    if (!session) return <p>Please log in to view your insights.</p>;

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.push('/')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5 text-spotify-grey hover:text-white" />
                </button>
                <h2 className="text-2xl font-bold">Listening Insights</h2>
            </div>

            {error ? (
                <p className="text-red-500">Failed to load listening history: {error.message}</p>
            ) : isLoading ? (
                <LoadingSpinner />
            ) : (
                <Heatmaps data={listeningHistory} />
            )}
        </div>
    );
}