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

export function ArtistWorldMap({ locations }: { locations: ArtistLocation[] }) {
    const [tooltipContent, setTooltipContent] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<{
        name: string;
        artists: string[];
    } | null>(null);

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
        const grouped = locations.reduce((acc, loc) => {
            const normalizedCountry = countryNameMapping[loc.country] || loc.country;
            if (!acc[normalizedCountry]) {
                acc[normalizedCountry] = [];
            }
            acc[normalizedCountry].push(loc.artistName);
            return acc;
        }, {} as Record<string, string[]>);
        
        console.log("Grouped artists by country:", grouped);
        return grouped;
    }, [locations]);

    // Calculate artists per country
    const countryData = useMemo(() => {
        const counts = Object.keys(artistsByCountry).reduce((acc, country) => {
            acc[country] = artistsByCountry[country].length;
            return acc;
        }, {} as Record<string, number>);

        const maxCount = Math.max(...Object.values(counts));
        console.log("Country counts:", counts);
        return { counts, maxCount };
    }, [artistsByCountry]);

    // Create color scale
    const colorScale = scaleLinear<string>()
        .domain([0, countryData.maxCount])
        .range(["#2C3333", "#1DB954"]);

    const handleCountryClick = (countryName: string, count: number) => {
        console.log("Country clicked:", countryName);
        console.log("Artists:", artistsByCountry[countryName]);
        
        if (count > 0) {
            setSelectedCountry({
                name: countryName,
                artists: artistsByCountry[countryName] || []
            });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="relative w-full h-[500px]">
                <ComposableMap
                    projection="geoEqualEarth"
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <ZoomableGroup>
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
                Showing locations for {locations.length} artists
            </div>
        </div>
    );
}