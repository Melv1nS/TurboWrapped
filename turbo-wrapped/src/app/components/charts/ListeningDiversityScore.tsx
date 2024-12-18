'use client';
import { useState } from 'react';
import { Bar } from 'recharts';

interface DiversityMetrics {
    genreDiversity: number;
    artistDiversity: number;
    albumDiversity: number;
}

interface ListeningDiversityScoreProps {
    data: DiversityMetrics;
}

export function ListeningDiversityScore({ data }: ListeningDiversityScoreProps) {
    const chartData = [
        {
            name: 'Genre Variety',
            score: data.genreDiversity * 100,
            weight: 40,
            description: 'How diverse your music genres are'
        },
        {
            name: 'Artist Variety',
            score: data.artistDiversity * 100,
            weight: 40,
            description: 'Distribution across different artists'
        },
        {
            name: 'Album Variety',
            score: data.albumDiversity * 100,
            weight: 20,
            description: 'Range of albums you listen to'
        },
    ].sort((a, b) => b.score - a.score);

    return (
        <div className="bg-spotify-dark-grey p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-6">Listening Diversity</h3>

            {/* Formula display */}
            <div className="mb-6 text-sm text-spotify-grey">
                <p className="mb-2">Score Formula:</p>
                <div className="bg-[#282828] p-3 rounded font-mono">
                    Score = (Genre × 0.4) + (Artist × 0.4) + (Album × 0.2)
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
        </div>
    );
}