import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/lib/prisma';
import rateLimit from '@/app/lib/rate-limit';

const limiter = rateLimit('insights');

export async function GET(request: Request) {
    const session = await getServerSession();
    if (!session?.user?.email) {
        console.log("No session or email found");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Apply rate limiting
        const identifier = session.user.email; // Use email as unique identifier
        const { success, remaining, limit, resetIn } = await limiter.check(identifier);
        
        if (!success) {
            return NextResponse.json(
                { 
                    error: 'Rate limit exceeded',
                    limit,
                    remaining,
                    resetIn 
                },
                { 
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': (Date.now() + resetIn).toString(),
                    }
                }
            );
        }

        // Get user first
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            console.log("User not found:", session.user.email);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get user's listening history
        const history = await prisma.listeningHistory.findMany({
            where: { userId: user.id },
            orderBy: { playedAt: 'desc' },
            take: 1000
        });

        if (history.length === 0) {
            console.log("No listening history found for user:", user.id);
            return NextResponse.json({ error: "No listening history" }, { status: 404 });
        }

        // Calculate traits
        const traits = await calculateTraits(history);
        console.log("Calculated traits:", traits);
        
        // Determine personality type
        const personality = determinePersonality(traits);
        console.log("Determined personality:", personality);

        return NextResponse.json(personality);
    } catch (error) {
        console.error('Error calculating personality insights:', error);
        return NextResponse.json(
            { error: 'Failed to calculate personality insights' },
            { status: 500 }
        );
    }
}

async function calculateTraits(history: any[]) {
    // Get unique artist names from history
    const artistNames = [...new Set(history.map(h => h.artistName))];
    
    // Get artist locations from ArtistLocation table
    const artistLocations = await prisma.artistLocation.findMany({
        where: {
            artistName: {
                in: artistNames
            }
        },
        select: {
            artistName: true,
            country: true
        }
    });

    // Calculate existing traits
    const uniqueArtists = new Set(history.map(h => h.artistName)).size;
    const variety = Math.min(uniqueArtists / history.length, 1);
    const timePatterns = analyzeTimePatterns(history);
    const consistency = calculateConsistencyScore(timePatterns);
    const discovery = calculateDiscoveryRate(history);
    const loyalty = calculateLoyaltyScore(history);
    const nocturnality = calculateNocturnalityScore(history);
    const mainstream = calculateMainstreamScore(history);

    // Calculate global discovery score
    const globalDiscovery = calculateGlobalDiscoveryScore(artistLocations);

    return { 
        variety, 
        consistency, 
        discovery, 
        loyalty, 
        nocturnality, 
        mainstream,
        globalDiscovery 
    };
}

function analyzeTimePatterns(history: any[]) {
    // Initialize time slots (24 hours)
    const timeSlots = Array(24).fill(0);
    const daySlots = Array(7).fill(0);
    
    history.forEach(item => {
        const date = new Date(item.playedAt);
        const hour = date.getHours();
        const day = date.getDay();
        
        timeSlots[hour]++;
        daySlots[day]++;
    });
    
    return { timeSlots, daySlots };
}

function calculateConsistencyScore(patterns: { timeSlots: number[], daySlots: number[] }) {
    // Calculate how consistent their listening times are
    const { timeSlots, daySlots } = patterns;
    
    // Calculate variance in listening times (lower variance = higher consistency)
    const timeAvg = timeSlots.reduce((a, b) => a + b, 0) / 24;
    const timeVariance = timeSlots.reduce((acc, val) => acc + Math.pow(val - timeAvg, 2), 0) / 24;
    
    // Calculate day-of-week consistency
    const dayAvg = daySlots.reduce((a, b) => a + b, 0) / 7;
    const dayVariance = daySlots.reduce((acc, val) => acc + Math.pow(val - dayAvg, 2), 0) / 7;
    
    // Normalize scores (lower variance = higher consistency)
    const timeConsistency = 1 / (1 + Math.sqrt(timeVariance) / timeAvg);
    const dayConsistency = 1 / (1 + Math.sqrt(dayVariance) / dayAvg);
    
    // Weight time consistency more heavily than day consistency
    return (timeConsistency * 0.6) + (dayConsistency * 0.4);
}

function calculateDiscoveryRate(history: any[]) {
    // Sort history by date
    const sortedHistory = [...history].sort((a, b) => 
        new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
    );
    
    // Track unique artists over time
    const knownArtists = new Set<string>();
    const discoveryPoints: number[] = [];
    
    sortedHistory.forEach(item => {
        const wasNew = !knownArtists.has(item.artistName);
        if (wasNew) {
            knownArtists.add(item.artistName);
        }
        discoveryPoints.push(wasNew ? 1 : 0);
    });
    
    // Calculate rolling average of discovery rate
    const windowSize = 50; // Look at last 50 tracks for recent discovery rate
    const recentDiscoveries = discoveryPoints.slice(-windowSize);
    const recentDiscoveryRate = recentDiscoveries.reduce((a, b) => a + b, 0) / windowSize;
    
    return recentDiscoveryRate;
}

function calculateLoyaltyScore(history: any[]) {
    // Count plays per artist
    const artistPlays = history.reduce((acc: Record<string, number>, item) => {
        acc[item.artistName] = (acc[item.artistName] || 0) + 1;
        return acc;
    }, {});
    
    // Calculate repeat listen ratio
    const totalPlays = history.length;
    const repeatPlays = Object.values(artistPlays).reduce((acc, plays) => acc + Math.max(0, plays - 1), 0);
    
    return repeatPlays / totalPlays;
}

function calculateNocturnalityScore(history: any[]) {
    // Define night hours (10 PM - 4 AM)
    const nightHours = new Set([22, 23, 0, 1, 2, 3, 4]);
    
    let nightPlays = 0;
    let totalPlays = history.length;
    
    history.forEach(item => {
        const hour = new Date(item.playedAt).getHours();
        if (nightHours.has(hour)) {
            nightPlays++;
        }
    });
    
    return nightPlays / totalPlays;
}

function calculateMainstreamScore(history: any[]) {
    const validEntries = history.filter(h => h.artistPopularity != null);
    if (validEntries.length === 0) return 0.5; // Default to middle if no data

    // Weight by play count for each artist
    const artistPopularities = validEntries.reduce((acc: Record<string, { total: number, count: number }>, item) => {
        if (!acc[item.artistName]) {
            acc[item.artistName] = { total: 0, count: 0 };
        }
        acc[item.artistName].total += item.artistPopularity;
        acc[item.artistName].count++;
        return acc;
    }, {});

    // Calculate weighted average popularity
    let totalWeight = 0;
    let weightedPopularity = 0;

    Object.values(artistPopularities).forEach(({ total, count }) => {
        weightedPopularity += (total / count) * count;
        totalWeight += count;
    });

    return weightedPopularity / (totalWeight * 100); // Normalize to 0-1
}

function calculateGlobalDiscoveryScore(locations: { artistName: string; country: string | null }[]) {
    // Filter out locations without country data
    const validLocations = locations.filter(loc => loc.country !== null);
    
    if (validLocations.length === 0) return 0;

    // Count unique countries
    const uniqueCountries = new Set(validLocations.map(l => l.country)).size;
    
    // Calculate score based on unique countries
    // Scale is logarithmic to reward early diversity but prevent extreme scores
    // 5 countries = 0.5, 10 countries = 0.75, 20 countries = 0.9, 30+ countries = ~1.0
    const score = Math.min(Math.log(uniqueCountries + 1) / Math.log(30), 1);
    
    return score;
}

function determinePersonality(traits: any) {
    const { variety, consistency, discovery, loyalty, nocturnality, mainstream } = traits;
    
    let personality = {
        primaryTrait: '',
        secondaryTrait: '',
        listeningCharacter: '',
        traits,
        description: ''
    };

    // Determine primary trait based on highest scores
    const traitScores = [
        { name: 'Explorer', score: (variety * 0.6 + discovery * 0.4) },
        { name: 'Loyalist', score: (loyalty * 0.7 + consistency * 0.3) },
        { name: 'Night Owl', score: nocturnality },
        { name: 'Early Bird', score: consistency * (1 - nocturnality) },
        { name: 'Eclectic', score: variety },
        { name: 'Focused', score: (1 - variety) * consistency },
        { name: 'Mainstream', score: mainstream }
    ].sort((a, b) => b.score - a.score);

    personality.primaryTrait = traitScores[0].name;
    personality.secondaryTrait = traitScores[1].name;

    // Assign character and description based on primary trait
    switch (personality.primaryTrait) {
        case 'Explorer':
            personality.listeningCharacter = 'The Explorer';
            personality.description = 'You\'re always on the hunt for new music, embracing different genres and artists. Your playlist is a journey of discovery.';
            break;
            
        case 'Loyalist':
            personality.listeningCharacter = 'The Loyalist';
            personality.description = 'You form deep connections with your favorite artists and their music. When you find something you love, you stick with it.';
            break;
            
        case 'Night Owl':
            personality.listeningCharacter = 'The Night Owl';
            personality.description = 'Music comes alive for you after dark. Your most meaningful listening sessions happen when the world is quiet.';
            break;
            
        case 'Early Bird':
            personality.listeningCharacter = 'The Early Bird';
            personality.description = 'You start your days with music, setting the tone for what\'s ahead. Your listening habits are as consistent as the sunrise.';
            break;
            
        case 'Eclectic':
            personality.listeningCharacter = 'The Eclectic';
            personality.description = 'Your taste knows no boundaries. From classical to hip-hop, your playlist is a diverse tapestry of sounds and styles.';
            break;
            
        case 'Focused':
            personality.listeningCharacter = 'The Focused';
            personality.description = 'You know what you like and stick to it. Your listening habits are deliberate and purposeful, creating your perfect soundtrack.';
            break;
            
        case 'Mainstream':
            personality.listeningCharacter = 'The Mainstream';
            personality.description = 'You prefer music that is popular and widely accepted. Your playlist is a mix of mainstream hits and timeless classics.';
            break;
            
        default:
            personality.listeningCharacter = 'The Melodist';
            personality.description = 'You have a unique way of experiencing music that defies easy categorization.';
    }

    return personality;
}