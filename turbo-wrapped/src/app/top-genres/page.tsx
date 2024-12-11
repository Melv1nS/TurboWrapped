'use client'
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';

interface Genre {
  name: string;
  count: number;
  cluster?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

export default function TopGenres() {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState('medium_term');

  const { data: genres = [], error } = useSWR<Genre[]>(
    session ? `/api/genres?time_range=${timeRange}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  const TagCloud = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const assignClusters = (genres: Genre[]) => {
      const genreFamilies = {
        // Electronic Music Spectrum
        house: ['house', 'deep house', 'tech house', 'progressive house'],
        techno: ['techno', 'minimal techno', 'industrial techno', 'acid techno'],
        trance: ['trance', 'psytrance', 'progressive trance', 'vocal trance'],
        dubstep: ['dubstep', 'brostep', 'riddim', 'future bass'],
        drum_and_bass: ['drum and bass', 'dnb', 'jungle', 'liquid funk'],
        ambient: ['ambient', 'downtempo', 'chillout', 'atmospheric'],
        
        // Rock Spectrum
        classic_rock: ['classic rock', '60s rock', '70s rock', 'psychedelic rock'],
        hard_rock: ['hard rock', 'arena rock', 'guitar rock'],
        metal: ['metal', 'heavy metal', 'death metal', 'black metal', 'doom metal'],
        punk: ['punk', 'punk rock', 'pop punk', 'hardcore punk'],
        alternative: ['alternative', 'alt rock', 'grunge', 'post-rock'],
        indie_rock: ['indie rock', 'indie folk', 'garage rock'],
        
        // Hip-Hop Spectrum
        old_school_hiphop: ['old school hip hop', 'golden age hip hop'],
        modern_hiphop: ['modern hip hop', 'contemporary hip hop'],
        trap: ['trap', 'drill', 'mumble rap', 'soundcloud rap'],
        conscious_hiphop: ['conscious hip hop', 'political hip hop'],
        gangsta_rap: ['gangsta rap', 'west coast rap', 'east coast rap'],
        
        // Jazz & Blues Spectrum
        classic_jazz: ['classic jazz', 'swing', 'bebop', 'big band'],
        modern_jazz: ['modern jazz', 'contemporary jazz', 'fusion'],
        smooth_jazz: ['smooth jazz', 'jazz fusion', 'jazz funk'],
        blues: ['blues', 'delta blues', 'chicago blues', 'rhythm and blues'],
        
        // Pop Spectrum
        mainstream_pop: ['pop', 'dance pop', 'teen pop'],
        indie_pop: ['indie pop', 'dream pop', 'synthpop'],
        art_pop: ['art pop', 'avant-pop', 'experimental pop'],
        kpop: ['k-pop', 'k-indie', 'k-rock'],
        
        // Folk & Country
        folk: ['folk', 'traditional folk', 'contemporary folk'],
        country: ['country', 'modern country', 'alt-country'],
        americana: ['americana', 'bluegrass', 'folk rock'],
        
        // World Music
        latin: ['latin', 'reggaeton', 'salsa', 'bachata'],
        african: ['afrobeats', 'afropop', 'highlife'],
        caribbean: ['reggae', 'dancehall', 'soca', 'calypso'],
        asian: ['asian pop', 'c-pop', 'j-pop'],
        
        // Classical & Composition
        classical: ['classical', 'orchestra', 'chamber music'],
        contemporary_classical: ['contemporary classical', 'minimalism'],
        film_score: ['soundtrack', 'film score', 'movie score'],
        
        // Modern Fusion
        lofi: ['lo-fi', 'chillhop', 'jazzhop'],
        vaporwave: ['vaporwave', 'synthwave', 'retrowave'],
        experimental: ['experimental', 'avant-garde', 'noise'],
      };

      return genres.map(genre => ({
        ...genre,
        cluster: Object.entries(genreFamilies).findIndex(([_, family]) => 
          family.some(g => genre.name.toLowerCase().includes(g))
        )
      }));
    };

    const calculatePosition = (index: number, genre: Genre) => {
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      
      const phi = (Math.sqrt(5) + 1) / 2;
      let angle = 2 * Math.PI * phi * index;
      
      if (genre.cluster !== -1) {
        angle += (genre.cluster * Math.PI / 18);
      }
      
      let radius = Math.min(Math.sqrt(index) * 60, Math.min(centerX, centerY) * 0.85);
      
      if (genre.cluster !== -1) {
        radius *= 0.7 + (genre.cluster % 6) * 0.1;
      }
      
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        rotation: (Math.random() - 0.5) * 15
      };
    };

    useEffect(() => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 600
        });
      }
    }, []);

    return (
      <div ref={containerRef} className="relative h-[600px] w-full overflow-hidden bg-black/20 rounded-xl">
        {dimensions.width > 0 && assignClusters(genres).map((genre, index) => {
          const normalizedCount = Math.pow(genre.count / genres[0].count, 0.7);
          const fontSize = Math.max(0.6, normalizedCount * 4.5);
          const position = calculatePosition(index, genre);
          const delay = index * 0.03;
          
          const clusterColors = [
            // Electronic spectrum
            'rgb(29, 185, 84)',   // Spotify green
            'rgb(0, 255, 255)',   // Cyan
            'rgb(127, 255, 212)', // Aquamarine
            'rgb(0, 191, 255)',   // Deep Sky Blue
            'rgb(30, 144, 255)',  // Dodger Blue
            'rgb(135, 206, 250)', // Light Sky Blue
            
            // Rock spectrum
            'rgb(255, 99, 132)',  // Red Pink
            'rgb(220, 20, 60)',   // Crimson
            'rgb(139, 0, 0)',     // Dark Red
            'rgb(255, 140, 0)',   // Dark Orange
            'rgb(255, 99, 71)',   // Tomato
            'rgb(233, 150, 122)', // Dark Salmon
            
            // Hip-hop spectrum
            'rgb(54, 162, 235)',  // Blue
            'rgb(65, 105, 225)',  // Royal Blue
            'rgb(0, 0, 205)',     // Medium Blue
            'rgb(25, 25, 112)',   // Midnight Blue
            'rgb(0, 71, 171)',    // Dark Blue
            
            // Jazz & Blues spectrum
            'rgb(255, 206, 86)',  // Yellow
            'rgb(255, 215, 0)',   // Gold
            'rgb(218, 165, 32)',  // Goldenrod
            'rgb(184, 134, 11)',  // Dark Goldenrod
            
            // Pop spectrum
            'rgb(153, 102, 255)', // Purple
            'rgb(138, 43, 226)',  // Blue Violet
            'rgb(147, 112, 219)', // Medium Purple
            'rgb(218, 112, 214)', // Orchid
            
            // Folk & Country
            'rgb(160, 82, 45)',   // Sienna
            'rgb(139, 69, 19)',   // Saddle Brown
            'rgb(205, 133, 63)',  // Peru
            
            // World Music
            'rgb(255, 127, 80)',  // Coral
            'rgb(255, 160, 122)', // Light Salmon
            'rgb(250, 128, 114)', // Salmon
            'rgb(233, 150, 122)', // Dark Salmon
            
            // Classical
            'rgb(112, 128, 144)', // Slate Gray
            'rgb(119, 136, 153)', // Light Slate Gray
            'rgb(176, 196, 222)', // Light Steel Blue
            
            // Modern Fusion
            'rgb(221, 160, 221)', // Plum
            'rgb(216, 191, 216)', // Thistle
            'rgb(238, 130, 238)', // Violet
          ];
          
          return (
            <motion.div
              key={genre.name}
              className="absolute cursor-pointer select-none whitespace-nowrap"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 0.6 + (normalizedCount * 0.4),
                scale: 1,
                x: position.x,
                y: position.y,
                rotate: position.rotation,
                transition: { delay, duration: 0.5 }
              }}
              whileHover={{ 
                scale: 1.1,
                opacity: 1,
                color: clusterColors[genre.cluster !== -1 ? genre.cluster : 0],
                transition: { duration: 0.2 }
              }}
              style={{ 
                fontSize: `${fontSize}rem`,
                fontWeight: index < 10 ? 'bold' : 'normal',
                transform: 'translate(-50%, -50%)',
                zIndex: genres.length - index,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                color: genre.cluster !== -1 
                  ? `${clusterColors[genre.cluster]}88`
                  : undefined
              }}
            >
              {genre.name}
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (!session) return null;
  
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500 p-4">
          {error.message || 'Failed to load genres'}
        </div>
      </div>
    );
  }

  if (!genres.length) {
    return (
      <div className="p-6">
        <div className="text-center p-4">
          Loading your top genres...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Top Genres</h2>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-opacity-10 bg-white rounded-md p-2 text-sm"
        >
          <option value="short_term">Last 4 Weeks</option>
          <option value="medium_term">Last 6 Months</option>
          <option value="long_term">All Time</option>
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <TagCloud />
      </motion.div>
    </div>
  );
}