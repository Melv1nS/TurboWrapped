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

function getBadge(score: number): { title: string; description: string } {
    if (score >= 80) {
        return { 
            title: "Music Omnivore", 
            description: "Your taste is as vast as the universe 🌌" 
        };
    } else if (score >= 60) {
        return { 
            title: "Genre Adventurer", 
            description: "Always exploring new musical territories 🗺️" 
        };
    } else if (score >= 40) {
        return { 
            title: "Melody Mixer", 
            description: "You keep things interesting! 🎵" 
        };
    } else if (score >= 20) {
        return { 
            title: "Comfort Groover", 
            description: "You know what you like 🎧" 
        };
    } else {
        return { 
            title: "Genre Specialist", 
            description: "Master of your musical domain 👑" 
        };
    }
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
    ].sort((a, b) => b.score - a.score); // Sort by score descending

    const calculateOverallScore = (): number => {
        const weights = {
            genreDiversity: 0.4,
            artistDiversity: 0.4,
            albumDiversity: 0.2,
        };

        return Math.round(
            Object.entries(data).reduce(
                (score, [key, value]) => score + value * weights[key as keyof DiversityMetrics] * 100,
                0
            )
        );
    };

    const overallScore = calculateOverallScore();
    const badge = getBadge(overallScore);

    return (
        <div className="bg-spotify-dark-grey p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">Listening Diversity</h3>
                    <div className="flex items-center gap-2">
                        <div className="bg-[#282828] px-3 py-1 rounded-full">
                            <span className="text-sm font-medium text-spotify-green">{badge.title}</span>
                        </div>
                        <span className="text-xs text-spotify-grey">{badge.description}</span>
                    </div>
                </div>
                <span className="text-2xl font-bold text-spotify-green">
                    {overallScore}%
                </span>
            </div>

            {/* Updated formula display */}
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