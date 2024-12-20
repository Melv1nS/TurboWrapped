import { formatDuration } from '../utils/formatters';
import { 
    ClockIcon, 
    MusicalNoteIcon, 
    UserGroupIcon, 
    CalendarIcon,
    UsersIcon,
    Square3Stack3DIcon as CollectionIcon,
    RectangleStackIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

interface ListeningHistoryItem {
    trackId: string;
    trackName: string;
    artistName: string;
    albumName: string;
    playedAt: string;
    duration: number;
}

interface ListeningStatsProps {
    data: {
        history: ListeningHistoryItem[];
        stats?: {
            totalTracks: number;
            uniqueTracks: number;
            uniqueArtists: number;
            totalDuration: {
                _sum: {
                    duration: number;
                }
            };
        };
        uniqueArtists: string[];
    };
}

export function ListeningStats({ data }: ListeningStatsProps) {
    // Calculate stats
    const totalTracks = data.history.length;
    const totalDuration = data.history.reduce((sum, track) => sum + (track.duration || 0), 0);
    const avgDuration = totalDuration / totalTracks;
    
    // Get unique albums
    const uniqueAlbums = [...new Set(data.history.map(track => track.albumName))];
    
    // Extract years from playedAt dates
    const years = data.history
        .map(track => new Date(track.playedAt).getFullYear())
        .filter(Boolean);
    
    const avgYear = years.length ? Math.round(years.reduce((sum, year) => sum + year, 0) / years.length) : new Date().getFullYear();
    const yearRange = years.length ? {
        oldest: Math.min(...years),
        newest: Math.max(...years)
    } : {
        oldest: new Date().getFullYear(),
        newest: new Date().getFullYear()
    };

    // Calculate average artists per track (always 1 in this case since we only store primary artist)
    const artistsPerTrack = 1;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Listening Time"
                value={formatDuration(totalDuration)}
                icon={<ClockIcon />}
                color="from-purple-500 to-pink-500"
            />
            <StatCard
                title="Average Track Duration"
                value={formatDuration(avgDuration)}
                icon={<MusicalNoteIcon />}
                color="from-blue-500 to-cyan-500"
            />
            <StatCard
                title="Average Play Year"
                value={avgYear.toString()}
                icon={<CalendarIcon />}
                color="from-green-500 to-emerald-500"
            />
            <StatCard
                title="Play Year Range"
                value={`${yearRange.oldest} - ${yearRange.newest}`}
                icon={<ChartBarIcon />}
                color="from-yellow-500 to-orange-500"
            />
            <StatCard
                title="Artists per Track"
                value={artistsPerTrack.toFixed(2)}
                icon={<UserGroupIcon />}
                color="from-red-500 to-rose-500"
            />
            <StatCard
                title="Unique Artists"
                value={data.uniqueArtists.length.toString()}
                icon={<UsersIcon />}
                color="from-indigo-500 to-violet-500"
            />
            <StatCard
                title="Unique Albums"
                value={uniqueAlbums.length.toString()}
                icon={<CollectionIcon />}
                color="from-fuchsia-500 to-pink-500"
            />
            <StatCard
                title="Total Plays"
                value={totalTracks.toString()}
                icon={<RectangleStackIcon />}
                color="from-teal-500 to-cyan-500"
            />
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
    return (
        <div className="group relative bg-spotify-darker-grey p-4 rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            {/* Gradient background that shows on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className={`w-8 h-8 bg-gradient-to-br ${color} rounded-lg p-1.5 text-white`}>
                    {icon}
                </div>
                
                {/* Text content */}
                <div className="flex-1">
                    <h4 className="text-spotify-grey text-sm font-medium mb-1">{title}</h4>
                    <p className="text-white text-xl font-bold tracking-tight">{value}</p>
                </div>
            </div>
        </div>
    );
}