import dynamic from 'next/dynamic';
import { formatDuration } from '@/app/utils/formatters';

// Import ApexCharts dynamically to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface PatternData {
    heatmap: number[][];
    duration: number[][];
    timeRange: {
        start: string;
        end: string;
    };
    stats: {
        totalPlays: number;
        totalDuration: number;
        peakListening: {
            hour: number;
            day: number;
        };
        streak: {
            count: number;
            startDay: string | null;
            endDay: string | null;
        };
    };
}

export function ListeningPatternHeatmap({ data }: { data: PatternData }) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => 
        i === 0 ? '12am' : i === 12 ? '12pm' : i > 12 ? `${i-12}pm` : `${i}am`
    );

    const maxValue = Math.max(...data.heatmap.flat());

    // Transform data for ApexCharts
    const series = days.map((day, dayIndex) => ({
        name: day,
        data: data.heatmap[dayIndex].map((value, hourIndex) => ({
            x: hours[hourIndex],
            y: value,
            duration: data.duration[dayIndex][hourIndex]
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
                const duration = data.duration[seriesIndex][dataPointIndex];
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
        <div className="bg-spotify-dark-grey p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">When You Listen</h3>
                <span className="text-sm text-spotify-grey">Last 30 Days</span>
            </div>
            
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