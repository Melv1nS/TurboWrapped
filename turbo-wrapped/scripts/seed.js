const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Replace this with your actual user ID from Prisma Studio
const YOUR_USER_ID = 'cm4r6t3a20000qnhjtsqj8pz4';

const MUSICBRAINZ_APP = {
    name: process.env.MUSICBRAINZ_APP_NAME || 'TurboWrapped-Dev',
    version: process.env.MUSICBRAINZ_APP_VERSION || '1.0.0',
    email: process.env.MUSICBRAINZ_APP_EMAIL || 'your@email.com'
};

const TEST_DATA = [
    {
        artistId: '4gzpq5DPGxSnKTe4SA8HAU',
        artistName: 'Coldplay',
        trackId: '1mea3bSkSGXuIRvnydlB5b',
        trackName: 'Viva La Vida',
        albumName: 'Viva la Vida',
        genres: ['alternative rock', 'pop'],
    },
    {
        artistId: '3qm84nBOXUEQ2vnTfUTTFC',
        artistName: 'Guns N\' Roses',
        trackId: '4pbG9SUmWIvsROVLF0zF9s',
        trackName: 'Sweet Child O\' Mine',
        albumName: 'Appetite for Destruction',
        genres: ['hard rock', 'rock'],
    },
    {
        artistId: '1uNFoZAHBGtllmzznpCI3s',
        artistName: 'BTS',
        trackId: '5QDLhrAOJJdNAmCTJ8xMyW',
        trackName: 'Dynamite',
        albumName: 'BE',
        genres: ['k-pop', 'pop'],
    }
];

async function getArtistLocation(artistName) {
    try {
        // MusicBrainz API call
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

        // Geocoding API call
        const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(artist.area.name)}&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': `${MUSICBRAINZ_APP.name}/${MUSICBRAINZ_APP.version} ( ${MUSICBRAINZ_APP.email} )`
                }
            }
        );

        if (!geoResponse.ok) return null;

        const geoData = await geoResponse.json();
        if (!geoData?.[0]) return null;

        return {
            country: artist.area.name,
            latitude: parseFloat(geoData[0].lat),
            longitude: parseFloat(geoData[0].lon)
        };
    } catch (error) {
        console.error(`Error fetching location for ${artistName}:`, error);
        return null;
    }
}

async function seedTestData() {
    try {
        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: YOUR_USER_ID },
        });

        if (!user) {
            throw new Error('User not found! Please make sure to log in first and use the correct user ID');
        }

        console.log('Using existing user:', user.email);

        // Clear existing test data
        console.log('Clearing existing data...');
        await prisma.listeningHistory.deleteMany({
            where: { userId: YOUR_USER_ID }
        });
        await prisma.artistLocation.deleteMany();

        // Add new test data
        for (const data of TEST_DATA) {
            console.log(`Processing ${data.artistName}...`);

            // Create listening history entries
            const timestamps = [
                new Date(Date.now() - 1000 * 60 * 60 * 2),  // 2 hours ago
                new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                new Date(Date.now() - 1000 * 60 * 60 * 48)  // 2 days ago
            ];

            for (const timestamp of timestamps) {
                await prisma.listeningHistory.create({
                    data: {
                        userId: YOUR_USER_ID,
                        trackId: data.trackId,
                        trackName: data.trackName,
                        artistName: data.artistName,
                        albumName: data.albumName,
                        genres: data.genres,
                        playedAt: timestamp,
                        duration: 180000,
                    },
                });
            }

            // Get and store artist location
            console.log(`Fetching location for ${data.artistName}...`);
            const location = await getArtistLocation(data.artistName);
            
            if (location) {
                await prisma.artistLocation.create({
                    data: {
                        artistId: data.artistId,
                        artistName: data.artistName,
                        ...location
                    }
                });
                console.log(`Stored location for ${data.artistName}`);
            }

            // Respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 1100));
        }

        console.log('Successfully seeded test data!');
    } catch (error) {
        console.error('Error seeding test data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
