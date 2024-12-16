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
}

export function Heatmaps({ data }: { data: PatternData }) {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

    const getFilteredData = (range: 'week' | 'month' | 'year'): PatternData => {
        const now = new Date();
        const startDate = new Date();

        switch (range) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        return {
            history: data.history.filter(item => {
                const playedAt = new Date(item.playedAt);
                return playedAt >= startDate && playedAt <= now;
            })
        };
    };

    const filteredData = getFilteredData(timeRange);

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

            {timeRange === 'week' && <WeekHeatmap data={filteredData} />}
            {timeRange === 'month' && <MonthHeatmap data={filteredData} />}
            {timeRange === 'year' && <YearHeatmap data={filteredData} />}
        </div>
    );
}