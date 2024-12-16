import React, { useState } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { formatDuration } from '@/app/utils/formatters';

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

export function YearHeatmap({ data }: { data: PatternData }) {
    const [currentDate, setCurrentDate] = useState(() => new Date());

    const navigateYear = (direction: 'prev' | 'next') => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (direction === 'prev') {
                newDate.setFullYear(prevDate.getFullYear() - 1);
            } else {
                newDate.setFullYear(prevDate.getFullYear() + 1);
            }
            return newDate;
        });
    };

    const year = currentDate.getFullYear();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-[#1a1a1a]';
        if (count <= 2) return 'bg-[#1DB954] bg-opacity-25';
        if (count <= 4) return 'bg-[#1DB954] bg-opacity-50';
        if (count <= 6) return 'bg-[#1DB954] bg-opacity-75';
        return 'bg-[#1DB954]';
    };

    const weekDays = [
        { key: 'sun', label: 'Sun' },
        { key: 'mon', label: 'Mon' },
        { key: 'tue', label: 'Tue' },
        { key: 'wed', label: 'Wed' },
        { key: 'thu', label: 'Thu' },
        { key: 'fri', label: 'Fri' },
        { key: 'sat', label: 'Sat' }
    ];

    return (
        <div className="p-4">
            {/* Year Navigation */}
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={() => navigateYear('prev')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ChevronLeftIcon className="h-5 w-5 text-spotify-grey" />
                </button>
                <h2 className="text-xl font-bold">{year}</h2>
                <button 
                    onClick={() => navigateYear('next')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ChevronRightIcon className="h-5 w-5 text-spotify-grey" />
                </button>
            </div>

            {/* Monthly Calendars Grid */}
            <div className="grid grid-cols-3 gap-6">
                {months.map((monthName, monthIndex) => {
                    const getDaysInMonth = (year: number, month: number) => 
                        new Date(year, month + 1, 0).getDate();
                    const getFirstDayOfMonth = (year: number, month: number) => 
                        new Date(year, month, 1).getDay();

                    const daysInMonth = getDaysInMonth(year, monthIndex);
                    const firstDayOfMonth = getFirstDayOfMonth(year, monthIndex);

                    const days = Array.from({ length: daysInMonth }, (_, i) => {
                        const date = new Date(year, monthIndex, i + 1);
                        const dayData = data.history.filter(
                            item => {
                                const playedAt = new Date(item.playedAt);
                                return playedAt.getFullYear() === year && 
                                       playedAt.getMonth() === monthIndex && 
                                       playedAt.getDate() === i + 1;
                            }
                        );
                        return { 
                            date, 
                            count: dayData.length,
                            duration: dayData.reduce((sum, item) => sum + item.duration, 0)
                        };
                    });

                    return (
                        <div key={monthName} className="bg-spotify-dark-elevated p-2 rounded">
                            <h3 className="text-sm font-medium mb-2 text-center">{monthName}</h3>
                            <div className="grid grid-cols-7 gap-[2px]">
                                {/* Weekday headers */}
                                {weekDays.map(day => (
                                    <div key={day.key} className="text-center text-xs text-spotify-grey">
                                        {day.label}
                                    </div>
                                ))}
                                
                                {/* Empty cells */}
                                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square"></div>
                                ))}
                                
                                {/* Calendar days */}
                                {days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`aspect-square relative ${getColorClass(day.count)}`}
                                        data-tooltip-id="year-calendar-tooltip"
                                        data-tooltip-content={`${day.date.toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}: ${day.count} plays${
                                            day.count > 0 ? ` (${formatDuration(day.duration)})` : ''
                                        }`}
                                    >
                                        <span className="absolute top-0 left-0 text-[0.6rem] p-[2px]">
                                            {i + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <ReactTooltip id="year-calendar-tooltip" />

            {/* Legend */}
            <div className="flex justify-center items-center gap-4 mt-6 text-sm text-spotify-grey">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#1a1a1a] rounded"></div>
                    <span>No plays</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#1DB954] opacity-25 rounded"></div>
                    <span>1-2 plays</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#1DB954] opacity-50 rounded"></div>
                    <span>3-4 plays</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#1DB954] opacity-75 rounded"></div>
                    <span>5-6 plays</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#1DB954] rounded"></div>
                    <span>7+ plays</span>
                </div>
            </div>
        </div>
    );
}
