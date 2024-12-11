'use client'
import { Disclosure } from '@headlessui/react';
import type { Filters, FilterStats } from '../listening-history/types';

interface FilterPanelProps {
    filters: Filters;
    filterStats: FilterStats;
    onChange: (newFilters: Filters) => void;
}

export function FilterPanel({ filters, filterStats, onChange }: FilterPanelProps) {
    return (
        <div className="bg-spotify-dark-grey rounded-lg p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search tracks or artists..."
                    value={filters.searchQuery}
                    onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
                    className="w-full bg-black bg-opacity-30 rounded-full px-4 py-2 pl-10"
                />
                <svg 
                    className="absolute left-3 top-2.5 h-5 w-5 text-spotify-grey"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Time of Day Filter */}
            <div className="px-4">
                <h3 className="mb-2">Time of Day</h3>
                <div className="grid grid-cols-2 gap-2">
                    {['morning', 'afternoon', 'evening', 'night'].map(time => (
                        <button
                            key={time}
                            onClick={() => {
                                const newTimeOfDay = filters.timeOfDay.includes(time)
                                    ? filters.timeOfDay.filter(t => t !== time)
                                    : [...filters.timeOfDay, time];
                                onChange({ ...filters, timeOfDay: newTimeOfDay });
                            }}
                            className={`px-3 py-1 rounded-full text-sm ${
                                filters.timeOfDay.includes(time)
                                    ? 'bg-spotify-green text-black'
                                    : 'bg-black bg-opacity-30'
                            }`}
                        >
                            {time.charAt(0).toUpperCase() + time.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Day of Week Filter */}
            <div className="px-4">
                <h3 className="mb-2">Day of Week</h3>
                <div className="grid grid-cols-7 gap-2">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                        <button
                            key={day}
                            onClick={() => {
                                const newDaysOfWeek = filters.daysOfWeek.includes(day)
                                    ? filters.daysOfWeek.filter(d => d !== day)
                                    : [...filters.daysOfWeek, day];
                                onChange({ ...filters, daysOfWeek: newDaysOfWeek });
                            }}
                            className={`px-3 py-1 rounded-full text-xs ${
                                (filters.daysOfWeek ?? []).includes(day)
                                    ? 'bg-spotify-green text-black'
                                    : 'bg-black bg-opacity-30'
                            }`}
                        >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Duration Range */}
            <div className="px-4">
                <h3 className="mb-2">Duration</h3>
                <div className="space-y-2">
                    <input
                        type="range"
                        min={filterStats.durationRange.min}
                        max={filterStats.durationRange.max}
                        value={filters.duration.max}
                        onChange={(e) => onChange({
                            ...filters,
                            duration: { ...filters.duration, max: Number(e.target.value) }
                        })}
                        className="w-full"
                    />
                    <div className="flex justify-between text-sm text-spotify-grey">
                        <span>{Math.floor(filters.duration.min / 60000)}m</span>
                        <span>{Math.floor(filters.duration.max / 60000)}m</span>
                    </div>
                </div>
            </div>
        </div>
    );
}