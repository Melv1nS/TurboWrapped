import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useState, useMemo, useEffect } from "react";
import { feature } from "topojson-client";
import { scaleLinear } from "d3-scale";
// @ts-ignore
import worldData from "world-atlas/countries-110m.json";

interface ArtistLocation {
    artistName: string;
    country: string;
    latitude: number;
    longitude: number;
}

// Convert TopoJSON to GeoJSON
const geoData = feature(worldData, worldData.objects.countries);

const countryNameMapping: Record<string, string> = {
    "United States": "United States of America",
    "USA": "United States of America",
    "UK": "United Kingdom",
    // Add more mappings as needed
};

// Modify the component props to accept both datasets
interface Props {
  locations: ArtistLocation[];
  userArtists: Set<string>; // Set of artist names the user has listened to
}

export function ArtistWorldMap({ locations, userArtists }: Props) {
    const [tooltipContent, setTooltipContent] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<{
        name: string;
        artists: string[];
    } | null>(null);

    // Add a default empty Set if userArtists is undefined
    const safeUserArtists = userArtists || new Set<string>();

    // Add console.log to debug
    console.log('Total locations received:', locations.length);
    console.log('Total user artists:', safeUserArtists.size);

    // Filter locations to only include artists the user has listened to
    const filteredLocations = useMemo(() => {
        console.log('Filtering locations...');
        console.log('All locations:', locations);
        console.log('User artists:', Array.from(safeUserArtists));
        
        const filtered = locations.filter(location => {
            const hasArtist = safeUserArtists.has(location.artistName);
            if (!hasArtist) {
                console.log('Filtered out:', location.artistName);
            }
            return hasArtist;
        });
        
        console.log('Filtered locations:', filtered);
        return filtered;
    }, [locations, safeUserArtists]);

    // Add console.log to debug
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('Search term changed:', e.target.value);
        setSearchTerm(e.target.value);
    };

    // Reset search term when modal closes
    useEffect(() => {
        if (!selectedCountry) {
            setSearchTerm("");
        }
    }, [selectedCountry]);

    // Group artists by country with debug logging
    const artistsByCountry = useMemo(() => {
        const grouped = filteredLocations.reduce((acc, loc) => {
            const normalizedCountry = countryNameMapping[loc.country] || loc.country;
            if (!acc[normalizedCountry]) {
                acc[normalizedCountry] = [];
            }
            acc[normalizedCountry].push(loc.artistName);
            return acc;
        }, {} as Record<string, string[]>);
        
        return grouped;
    }, [filteredLocations]);

    // Calculate artists per country
    const countryData = useMemo(() => {
        const counts = Object.keys(artistsByCountry).reduce((acc, country) => {
            acc[country] = artistsByCountry[country].length;
            return acc;
        }, {} as Record<string, number>);

        const maxCount = Math.max(...Object.values(counts));
        return { counts, maxCount };
    }, [artistsByCountry]);

    // Create color scale
    const colorScale = scaleLinear<string>()
        .domain([0, countryData.maxCount])
        .range(["#2C3333", "#1DB954"]);

    const handleCountryClick = (countryName: string, count: number) => {
        
        if (count > 0) {
            setSelectedCountry({
                name: countryName,
                artists: artistsByCountry[countryName] || []
            });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="text-spotify-grey text-sm mb-2 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span>Drag to pan • Scroll or pinch to zoom</span>
            </div>

            <div className="relative w-full h-[500px] cursor-move">
                <ComposableMap
                    projection="geoEqualEarth"
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <ZoomableGroup>
                        <div className="absolute right-4 top-4 flex flex-col gap-2 bg-spotify-dark-elevated rounded-lg shadow-lg">
                            <button 
                                className="p-2 text-white hover:bg-spotify-dark-highlight transition-colors"
                                onClick={() => {/* Add zoom in handler */}}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </button>
                            <button 
                                className="p-2 text-white hover:bg-spotify-dark-highlight transition-colors border-t border-spotify-dark-highlight"
                                onClick={() => {/* Add zoom out handler */}}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>
                        </div>

                        <Geographies geography={geoData}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const count = countryData.counts[geo.properties.name] || 0;
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={colorScale(count)}
                                            stroke="#FFFFFF"
                                            strokeWidth={0.5}
                                            onMouseEnter={() => {
                                                setTooltipContent(
                                                    `${geo.properties.name}: ${count} artist${count !== 1 ? 's' : ''}`
                                                );
                                            }}
                                            onMouseLeave={() => {
                                                setTooltipContent("");
                                            }}
                                            onClick={() => handleCountryClick(geo.properties.name, count)}
                                            style={{
                                                default: {
                                                    outline: "none",
                                                    cursor: count > 0 ? "pointer" : "default"
                                                },
                                                hover: {
                                                    fill: count > 0 ? "#15833C" : "#374151",
                                                    outline: "none"
                                                },
                                                pressed: {
                                                    outline: "none"
                                                }
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
                {tooltipContent && (
                    <div
                        className="absolute bg-spotify-dark-elevated text-white px-2 py-1 rounded-md text-sm"
                        style={{
                            left: `${window.event?.pageX - 100}px`,
                            top: `${window.event?.pageY - 60}px`
                        }}
                    >
                        {tooltipContent}
                    </div>
                )}

                {/* Enhanced Modal */}
                {selectedCountry && (
                    <div 
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedCountry(null)}
                    >
                        <div 
                            className="bg-spotify-dark-elevated rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-spotify-dark-highlight">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">
                                            Artists from {selectedCountry.name}
                                        </h3>
                                        <p className="text-spotify-grey text-sm">
                                            {selectedCountry.artists.length} artist{selectedCountry.artists.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCountry(null)}
                                        className="text-spotify-grey hover:text-white transition-colors p-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="mt-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search artists..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className="w-full bg-[#282828] text-white px-4 py-2 rounded-md pl-10 
                                                     focus:outline-none focus:ring-2 focus:ring-spotify-green
                                                     placeholder-spotify-grey"
                                            style={{ 
                                                caretColor: 'white'
                                            }}
                                        />
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-5 w-5 absolute left-3 top-2.5 text-spotify-grey pointer-events-none"
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Artists List */}
                            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(80vh - 180px)" }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedCountry.artists
                                        .filter(artist => artist.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((artist, index) => (
                                            <div 
                                                key={artist}
                                                className="flex items-center space-x-3 p-3 hover:bg-spotify-dark-highlight rounded-md transition-colors group"
                                            >
                                                <div className="w-8 h-8 bg-spotify-dark-highlight rounded-full flex items-center justify-center text-sm text-spotify-grey group-hover:bg-spotify-dark-elevated">
                                                    {index + 1}
                                                </div>
                                                <span className="text-white truncate">{artist}</span>
                                            </div>
                                        ))
                                    }
                                </div>

                                {/* No Results State */}
                                {selectedCountry.artists.filter(artist => 
                                    artist.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                    <div className="text-center text-spotify-grey py-8">
                                        No artists found matching "{searchTerm}"
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-spotify-dark-highlight p-4">
                                <div className="flex justify-between items-center text-sm text-spotify-grey">
                                    <span>Tip: Use the search bar to filter artists</span>
                                    <button 
                                        onClick={() => setSelectedCountry(null)}
                                        className="text-white bg-spotify-dark-highlight px-4 py-2 rounded-full hover:bg-opacity-80 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="text-center text-spotify-grey mt-4">
                Showing locations for {filteredLocations.length} artists
            </div>
        </div>
    );
}