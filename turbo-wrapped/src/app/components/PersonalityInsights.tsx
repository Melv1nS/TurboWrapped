import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';

interface PersonalityData {
    primaryTrait: string;
    secondaryTrait: string;
    listeningCharacter: string;
    traits: {
      variety: number;      // How diverse their music taste is
      consistency: number;  // How consistent their listening patterns are
      discovery: number;    // How often they listen to new music
      loyalty: number;      // How often they return to favorite artists
      nocturnality: number; // When they typically listen to music
      mainstream: number;   // Preference for popular vs underground artists
      globalDiscovery: number; // How many different countries their artists are from
    };
    description: string;
}

interface Props {
    data: PersonalityData;
}

interface Badge {
    name: string;
    emoji: string;
    description: string;
    threshold: number;
    trait: string | 'composite';
    calculate?: (traits: PersonalityData['traits']) => number;
}

export function PersonalityInsights({ data }: Props) {
    if (!data) {
        return <div>No personality data available</div>;
    }

    const badges: Badge[] = [
        {
            name: "Genre Explorer",
            emoji: "🗺️",
            description: "You've explored a wide variety of music genres",
            threshold: 0.7,
            trait: "variety"
        },
        {
            name: "Super Fan",
            emoji: "⭐",
            description: "You show incredible loyalty to your favorite artists",
            threshold: 0.8,
            trait: "loyalty"
        },
        {
            name: "Night Rider",
            emoji: "🌙",
            description: "Your favorite time to listen is after dark",
            threshold: 0.7,
            trait: "nocturnality"
        },
        {
            name: "Early Riser",
            emoji: "🌅",
            description: "You start your days with music",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => (1 - traits.nocturnality) * traits.consistency
        },
        {
            name: "Underground Scout",
            emoji: "🔍",
            description: "You prefer artists off the beaten path",
            threshold: 0.3,
            trait: "mainstream"
        },
        {
            name: "Trend Surfer",
            emoji: "🌊",
            description: "You stay on top of what's popular",
            threshold: 0.7,
            trait: "mainstream"
        },
        {
            name: "Global Explorer",
            emoji: "🌍",
            description: "Your music comes from all corners of the world",
            threshold: 0.6,
            trait: "globalDiscovery"
        },
        {
            name: "World Citizen",
            emoji: "🎵",
            description: "Your playlist is a true global symphony",
            threshold: 0.8,
            trait: "globalDiscovery"
        },
        {
            name: "Night Wanderer",
            emoji: "🌌",
            description: "You explore new artists during the night hours",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => traits.nocturnality * traits.discovery
        },
        {
            name: "Dawn Discoverer",
            emoji: "🌄",
            description: "Early morning is your time for finding new music",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => (1 - traits.nocturnality) * traits.discovery
        },
        {
            name: "Global Night Owl",
            emoji: "🦉",
            description: "Your late-night sessions feature artists from around the world",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => traits.nocturnality * traits.globalDiscovery
        },
        {
            name: "Indie Pioneer",
            emoji: "🚀",
            description: "You discover underground artists before they go mainstream",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => (1 - traits.mainstream) * traits.discovery
        },
        {
            name: "Loyal Explorer",
            emoji: "🧭",
            description: "You balance discovering new music while staying loyal to your favorites",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => (traits.loyalty + traits.discovery) / 2
        },
        {
            name: "Time Traveler",
            emoji: "⏰",
            description: "Your music taste varies dramatically between day and night",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => Math.abs(traits.nocturnality - 0.5) * 2
        },
        {
            name: "Global Trendsetter",
            emoji: "🌟",
            description: "You discover trending artists from different countries",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => traits.globalDiscovery * traits.mainstream
        },
        {
            name: "Rhythm Ritualist",
            emoji: "🎯",
            description: "Your listening schedule is incredibly consistent",
            threshold: 0.85,
            trait: "consistency"
        },
        {
            name: "Genre Specialist",
            emoji: "💎",
            description: "You've mastered your preferred music niche",
            threshold: 0.8,
            trait: "composite",
            calculate: (traits) => (1 - traits.variety) * traits.loyalty
        },
        {
            name: "Music Adventurer",
            emoji: "🗺️",
            description: "You're always exploring new musical territories",
            threshold: 0.75,
            trait: "composite",
            calculate: (traits) => (traits.variety + traits.discovery + traits.globalDiscovery) / 3
        },
        {
            name: "Daybreak DJ",
            emoji: "🌞",
            description: "Your morning music selections set the perfect tone for the day",
            threshold: 0.7,
            trait: "composite",
            calculate: (traits) => (1 - traits.nocturnality) * traits.consistency
        },
        {
            name: "Harmony Hunter",
            emoji: "🎯",
            description: "You've found the perfect balance in your listening habits",
            threshold: 0.8,
            trait: "composite",
            calculate: (traits) => (traits.consistency + traits.loyalty + traits.variety) / 3
        }
    ];

    const earnedBadges = badges.filter(badge => {
        if (badge.trait === "composite" && badge.calculate) {
            return badge.calculate(data.traits) >= badge.threshold;
        }
        
        const traitValue = data.traits[badge.trait as keyof typeof data.traits];
        if (traitValue === undefined) return false;
        
        return badge.trait === "mainstream" 
            ? traitValue <= badge.threshold 
            : traitValue >= badge.threshold;
    });

    const getTraitEmoji = (trait: string) => {
        const emojiMap: Record<string, string> = {
            'Explorer': '🗺️',
            'Loyalist': '💝',
            'Night Owl': '🌙',
            'Early Bird': '🌅',
            'Eclectic': '🎨',
            'Focused': '🎯',
            'Trendsetter': '🌟',
            'Chart Topper': '📈'
        };
        return emojiMap[trait] || '🎵';
    };

    const traitDescriptions: Record<string, string> = {
        variety: "Calculated based on the number of unique artists in your listening history compared to total plays",
        consistency: "Measures how regular your listening patterns are throughout the day and week",
        discovery: "Based on how often you listen to artists for the first time",
        loyalty: "Calculated from how frequently you return to artists you've listened to before",
        nocturnality: "Determined by the percentage of your listening that occurs between 10 PM and 4 AM",
        mainstream: "Based on the popularity of the artists you listen to, showing your preference for mainstream vs underground music",
        globalDiscovery: "Based on the geographical diversity of your artists' origins, showing how globally diverse your music taste is"
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Character Type */}
            <div className="text-center p-8 bg-gradient-to-b from-spotify-black to-spotify-dark-grey rounded-2xl shadow-xl transition-all hover:shadow-spotify-green/10">
                <div className="animate-float">
                    <span className="text-7xl sm:text-8xl mb-6 block filter drop-shadow-lg">
                        {getTraitEmoji(data.listeningCharacter)}
                    </span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-spotify-green to-spotify-bright-green bg-clip-text text-transparent">
                    {data.listeningCharacter}
                </h4>
                <p className="text-spotify-grey mb-3 text-lg max-w-2xl mx-auto leading-relaxed">
                    {data.description}
                </p>
                <p className="text-xs text-spotify-grey/75 font-medium">
                    Based on your last 1,000 plays
                </p>
            </div>

            {/* Badges Section */}
            {earnedBadges.length > 0 && (
                <div className="p-6 sm:p-8 bg-gradient-to-br from-spotify-black to-spotify-dark-grey rounded-2xl shadow-lg">
                    <div className="text-center mb-6">
                        <h5 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-spotify-green to-spotify-bright-green bg-clip-text text-transparent">
                            Your Badges
                        </h5>
                        <p className="text-sm text-spotify-grey/90">
                            Unlock badges by reaching certain milestones in your listening habits
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {earnedBadges.map((badge) => (
                            <div 
                                key={badge.name}
                                className="relative group flex flex-col items-center p-4 bg-spotify-black/50 rounded-xl 
                                         hover:bg-spotify-green/10 transition-all duration-300 cursor-pointer
                                         transform hover:-translate-y-1"
                                data-tooltip-id={`badge-${badge.name}`}
                                data-tooltip-content={badge.description}
                            >
                                <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                    {badge.emoji}
                                </span>
                                <span className="text-sm font-medium text-center group-hover:text-spotify-green transition-colors">
                                    {badge.name}
                                </span>
                                <Tooltip 
                                    id={`badge-${badge.name}`}
                                    place="top"
                                    className="!bg-spotify-black !px-4 !py-2 !rounded-lg !text-sm !font-medium !opacity-100 !shadow-lg"
                                    style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                        zIndex: 50,
                                        maxWidth: '200px'
                                    }}
                                    offset={10}
                                    delayShow={100}
                                    delayHide={100}
                                    float={true}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Personality Traits */}
            <div className="p-6 sm:p-8 bg-gradient-to-br from-spotify-black to-spotify-dark-grey rounded-2xl shadow-lg">
                <div className="text-center mb-6">
                    <h5 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-spotify-green to-spotify-bright-green bg-clip-text text-transparent">
                        Trait Breakdown
                    </h5>
                    <p className="text-sm text-spotify-grey/90">
                        These scores reflect your listening patterns from your last 1,000 plays
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                    {Object.entries(data.traits).map(([trait, value]) => (
                        <div 
                            key={trait} 
                            className="group bg-spotify-black/50 p-5 rounded-xl hover:bg-spotify-green/10 
                                     transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                            data-tooltip-id={`tooltip-${trait}`}
                            data-tooltip-content={traitDescriptions[trait]}
                        >
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium capitalize group-hover:text-spotify-green transition-colors">
                                        {trait.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-sm font-bold text-spotify-green">
                                        {Math.round(value * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-spotify-black rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ 
                                            width: `${value * 100}%`,
                                            background: `linear-gradient(90deg, #1DB954 0%, #1ED760 100%)`
                                        }}
                                    />
                                </div>
                            </div>
                            <Tooltip 
                                id={`tooltip-${trait}`}
                                place="top"
                                className="!bg-spotify-black !px-4 !py-2 !rounded-lg !text-sm !font-medium !opacity-100 !shadow-lg"
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                                    zIndex: 50,
                                    maxWidth: '250px'
                                }}
                                offset={10}
                                delayShow={100}
                                delayHide={100}
                                float={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}