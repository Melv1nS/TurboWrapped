import { useState } from 'react';
import { WeekHeatmap } from './WeekHeatmap';
import { MonthHeatmap } from './MonthHeatmap';
import { YearHeatmap } from './YearHeatmap';

interface ListeningHistoryItem {
    trackId: string;
    trackName: string;
    artistName: string;
    albumName: string;
    playedAt: string;
    duration: number;
}

interface PatternData {
    history: ListeningHistoryItem[];
    // ... other properties if needed ...
}

export function ListeningPatternHeatmaps({ data }: { data: PatternData }) {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

    return (
        <div className="bg-spotify-dark-grey p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">When You Listen</h3>
                <div className="flex justify-end mb-4">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
                        className="bg-[#282828] text-white p-2 rounded"
                    >
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                    </select>
                </div>
            </div>



            {timeRange === 'week' && <WeekHeatmap data={data} />}
            {timeRange === 'month' && <MonthHeatmap data={data} />}
            {timeRange === 'year' && <YearHeatmap data={data} />}
        </div>
    );
}