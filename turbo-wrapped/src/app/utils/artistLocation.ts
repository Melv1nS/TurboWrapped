import { PrismaClient } from '@prisma/client';

const prismaLocation = new PrismaClient();

const MUSICBRAINZ_APP = {
    name: process.env.MUSICBRAINZ_APP_NAME || 'TurboWrapped-Dev',
    version: process.env.MUSICBRAINZ_APP_VERSION || '1.0.0',
    email: process.env.MUSICBRAINZ_APP_EMAIL || 'your@email.com'
};

interface LocationData {
    country?: string;
    latitude?: number;
    longitude?: number;
}

export async function getOrCreateArtistLocation(artistId: string, artistName: string): Promise<any> {
    try {
        // Check cache first
        const existingLocation = await prismaLocation.artistLocation.findUnique({
            where: { artistId }
        });

        if (existingLocation) {
            return existingLocation;
        }

        const location = await fetchArtistLocation(artistName);
        
        return await prismaLocation.artistLocation.create({
            data: {
                artistId,
                artistName,
                ...(location || {})
            }
        });
    } catch (error) {
        console.error(`Error processing location for ${artistName}:`, error);
        return null;
    }
}

async function fetchArtistLocation(artistName: string): Promise<LocationData | null> {
    try {
        const response = await fetch(
            `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(artistName)}&fmt=json`,
            {
                headers: {
                    'User-Agent': `${MUSICBRAINZ_APP.name}/${MUSICBRAINZ_APP.version} ( ${MUSICBRAINZ_APP.email} )`
                }
            }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        const artist = data.artists?.[0];
        
        if (!artist?.area?.name) return null;

        const coordinates = await geocodeLocation(artist.area.name);
        
        return {
            country: artist.area.name,
            ...coordinates
        };
    } catch (error) {
        console.error(`Error fetching location for ${artistName}:`, error);
        return null;
    }
}

async function geocodeLocation(location: string): Promise<{ latitude?: number; longitude?: number } | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': `${MUSICBRAINZ_APP.name}/${MUSICBRAINZ_APP.version} ( ${MUSICBRAINZ_APP.email} )`
                }
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (!data?.[0]) return null;

        return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
        };
    } catch (error) {
        console.error(`Error geocoding location ${location}:`, error);
        return null;
    }
}
