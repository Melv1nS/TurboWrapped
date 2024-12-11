interface ListeningHistoryItem {
    trackId: string;
    trackName: string;
    artistName: string;
    albumName: string;
    playedAt: string;
    duration: number;
}

interface Stats {
    totalTracks: number;
    uniqueTracks: number;
    uniqueArtists: number;
    totalDuration: {
        _sum: {
            duration: number;
        }
    };
}

interface TrackingPreferences {
    trackingEnabled: boolean;
}

interface FilterStats {
    genres: Array<{ name: string; count: number }>;
    artists: Array<{ name: string; count: number }>;
    durationRange: {
        min: number;
        max: number;
    };
}

interface Filters {
    genres: string[];
    artists: string[];
    timeOfDay: string[]; // 'morning', 'afternoon', 'evening', 'night'
    duration: {
        min: number;
        max: number;
    };
    searchQuery: string;
}

interface PaginationData {
    total: number;
    pages: number;
    currentPage: number;
}

interface ListeningHistoryResponse {
    history: ListeningHistoryItem[];
    stats: Stats;
    pagination: PaginationData;
}

export type {
    ListeningHistoryItem,
    Stats,
    TrackingPreferences,
    FilterStats,
    Filters,
    PaginationData,
    ListeningHistoryResponse
}