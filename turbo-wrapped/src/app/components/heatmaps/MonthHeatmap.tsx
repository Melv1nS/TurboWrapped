import React, { useState } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

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

export function MonthHeatmap({ data }: { data: PatternData }) {
    const [currentDate, setCurrentDate] = useState(() => new Date()); // Start with current month

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (direction === 'prev') {
                newDate.setMonth(prevDate.getMonth() - 1);
            } else {
                newDate.setMonth(prevDate.getMonth() + 1);
            }
            return newDate;
        });
    };
    
    // Create calendar data
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month, i + 1);
        const count = data.history.filter(
            item => {
                const playedAt = new Date(item.playedAt);
                return playedAt.getFullYear() === year && 
                       playedAt.getMonth() === month && 
                       playedAt.getDate() === i + 1;
            }
        ).length;
        return { date, count };
    });

    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-[#1a1a1a]';
        if (count <= 2) return 'bg-[#1DB954] bg-opacity-25';
        if (count <= 4) return 'bg-[#1DB954] bg-opacity-50';
        if (count <= 6) return 'bg-[#1DB954] bg-opacity-75';
        return 'bg-[#1DB954]';
    };

    return (
        <div className="p-4">
            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ChevronLeftIcon className="h-5 w-5 text-spotify-grey" />
                </button>
                <h2 className="text-xl font-bold">{monthName} {year}</h2>
                <button 
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ChevronRightIcon className="h-5 w-5 text-spotify-grey" />
                </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Weekday headers */}
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                    <div key={day} className="text-center text-sm text-spotify-grey p-2">
                        {day}
                    </div>
                ))}
                
                {/* Empty cells for days before the first of the month */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                
                {/* Calendar days */}
                {days.map((day, i) => (
                    <div
                        key={i}
                        className={`aspect-square p-1 relative ${getColorClass(day.count)}`}
                        data-tooltip-id="calendar-tooltip"
                        data-tooltip-content={`${day.date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                        })}: ${day.count} plays`}
                    >
                        <span className="absolute top-1 left-1 text-xs">
                            {i + 1}
                        </span>
                    </div>
                ))}
            </div>
            
            <ReactTooltip id="calendar-tooltip" />
            
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
