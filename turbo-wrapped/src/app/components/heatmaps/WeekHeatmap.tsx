import dynamic from 'next/dynamic';
import { formatDuration } from '@/app/utils/formatters';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

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

export function WeekHeatmap({ data }: { data: PatternData }) {
    const [currentDate, setCurrentDate] = useState(() => new Date());

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (direction === 'prev') {
                newDate.setDate(prevDate.getDate() - 7);
            } else {
                newDate.setDate(prevDate.getDate() + 7);
            }
            return newDate;
        });
    };

    // Calculate week range
    const endDate = new Date(currentDate);
    const startDate = new Date(currentDate);
    startDate.setDate(endDate.getDate() - 6); // Start from 6 days before to include current day

    // Filter data for the selected week
    const filteredData = data.history.filter(item => {
        const playedAtDate = new Date(item.playedAt);
        return playedAtDate >= startDate && playedAtDate <= endDate;
    });

    // Initialize heatmap data structure
    const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
    const durationData = Array(7).fill(0).map(() => Array(24).fill(0));

    // Populate heatmap data
    filteredData.forEach(item => {
        const date = new Date(item.playedAt);
        const day = date.getDay();
        const hour = date.getHours();
        heatmapData[day][hour]++;
        durationData[day][hour] += item.duration;
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => 
        i === 0 ? '12am' : i === 12 ? '12pm' : i > 12 ? `${i-12}pm` : `${i}am`
    );

    const maxValue = Math.max(...heatmapData.flat());

    const series = days.map((day, dayIndex) => ({
        name: day,
        data: heatmapData[dayIndex].map((value, hourIndex) => ({
            x: hours[hourIndex],
            y: value,
            duration: durationData[dayIndex][hourIndex]
        }))
    }));

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'heatmap',
            toolbar: {
                show: false
            },
            background: 'transparent',
            fontFamily: 'inherit',
            animations: {
                enabled: true,
                easing: 'easeinout',
            },
            padding: {
                left: 12
            }
        },
        dataLabels: {
            enabled: false
        },
        colors: ['#1DB954'], // Spotify green
        xaxis: {
            categories: hours,
            labels: {
                style: {
                    colors: '#9b9b9b',
                    fontSize: '12px'
                },
                formatter: (value) => {
                    const index = hours.indexOf(value);
                    return index % 2 === 0 ? value : '';
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#9b9b9b',
                    fontSize: '12px'
                },
                offsetX: -10
            }
        },
        grid: {
            show: false,
            padding: {
                top: 0,
                right: 8,
                bottom: 0,
                left: 40
            }
        },
        plotOptions: {
            heatmap: {
                radius: 2,
                enableShades: true,
                shadeIntensity: 0.5,
                colorScale: {
                    ranges: [{
                        from: 0,
                        to: 0,
                        color: '#1a1a1a',
                        name: 'no plays'
                    }, {
                        from: 0.1,
                        to: maxValue,
                        color: '#1DB954',
                        name: 'plays'
                    }]
                }
            }
        },
        tooltip: {
            custom: function({ seriesIndex, dataPointIndex, w }) {
                if (typeof seriesIndex === 'undefined' || typeof dataPointIndex === 'undefined') {
                    return '';
                }

                const value = w.globals.series[seriesIndex][dataPointIndex];
                const duration = durationData[seriesIndex][dataPointIndex];
                const day = days[seriesIndex];
                const hour = hours[dataPointIndex];

                return (
                    '<div class="bg-[#282828] p-2 rounded shadow-lg border border-[#2a2a2a]">' +
                    `<div class="text-white font-medium">${day} at ${hour}</div>` +
                    `<div class="text-[#B3B3B3]">${value} tracks</div>` +
                    `<div class="text-[#B3B3B3]">${formatDuration(duration)}</div>` +
                    '</div>'
                );
            }
        },
        states: {
            hover: {
                filter: {
                    type: 'none'
                }
            }
        },
        theme: {
            mode: 'dark'
        }
    };

    return (
        <div>
            {/* Week Navigation */}
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={() => navigateWeek('prev')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ChevronLeftIcon className="h-5 w-5 text-spotify-grey" />
                </button>
                <h2 className="text-xl font-bold">
                    {startDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    })} 
                    {' - '} 
                    {endDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                </h2>
                <button 
                    onClick={() => navigateWeek('next')}
                    className="p-2 hover:bg-spotify-dark-grey rounded-full transition-colors"
                >
                    <ChevronRightIcon className="h-5 w-5 text-spotify-grey" />
                </button>
            </div>

            {/* Chart */}
            <div className="h-[400px] pl-2">
                <Chart
                    options={options}
                    series={series}
                    type="heatmap"
                    height="100%"
                />
            </div>
        </div>
    );
}
