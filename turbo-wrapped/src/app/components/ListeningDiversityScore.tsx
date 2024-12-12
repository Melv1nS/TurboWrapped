'use client';
import { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Bar } from 'recharts';

interface DiversityMetrics {
    genreDiversity: number;
    artistDiversity: number;
    albumDiversity: number;
    timeOfDayDiversity: number;
}

interface ListeningDiversityScoreProps {
    data: DiversityMetrics;
}

export function ListeningDiversityScore({ data }: ListeningDiversityScoreProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const chartData = [
        {
            name: 'Genre Variety',
            score: data.genreDiversity * 100,
            weight: 30,
            description: 'How diverse your music genres are'
        },
        {
            name: 'Artist Variety',
            score: data.artistDiversity * 100,
            weight: 30,
            description: 'Distribution across different artists'
        },
        {
            name: 'Album Variety',
            score: data.albumDiversity * 100,
            weight: 15,
            description: 'Range of albums you listen to'
        },
        {
            name: 'Listening Pattern',
            score: data.timeOfDayDiversity * 100,
            weight: 15,
            description: 'How varied your listening times are'
        },
    ].sort((a, b) => b.score - a.score); // Sort by score descending

    const calculateOverallScore = (): number => {
        const weights = {
            genreDiversity: 0.3,
            artistDiversity: 0.3,
            albumDiversity: 0.15,
            timeOfDayDiversity: 0.15,
        };

        return Math.round(
            Object.entries(data).reduce(
                (score, [key, value]) => score + value * weights[key as keyof DiversityMetrics] * 100,
                0
            )
        );
    };

    return (
        <div className="bg-spotify-dark-grey p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Listening Diversity</h3>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-spotify-green">
                        {calculateOverallScore()}%
                    </span>
                    <button
                        className="text-spotify-grey hover:text-white transition-colors"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <QuestionMarkCircleIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Diversity Metrics Display */}
            <div className="space-y-4">
                {chartData.map((metric) => (
                    <div key={metric.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>{metric.name}</span>
                            <span className="text-spotify-green">{Math.round(metric.score)}%</span>
                        </div>
                        <div className="h-2 bg-spotify-black rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-spotify-green transition-all duration-500"
                                style={{ width: `${metric.score}%` }}
                            />
                        </div>
                        <p className="text-xs text-spotify-grey">{metric.description}</p>
                    </div>
                ))}
            </div>

            {showTooltip && (
                <div className="absolute mt-2 p-3 bg-spotify-black rounded-lg shadow-lg text-xs max-w-xs">
                    <p className="mb-2">Your Overall Diversity Score is weighted based on importance:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Genre & Artist Variety: 30% each</li>
                        <li>Album Variety & Listening Pattern: 15% each</li>
                    </ul>
                    <p className="mt-2">Higher scores mean more diverse listening habits!</p>
                </div>
            )}
        </div>
    );
}