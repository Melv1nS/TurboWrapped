'use client'
import { useEffect, useRef } from 'react';
import TagCloud from 'TagCloud';

interface Genre {
  name: string;
  count: number;
}

interface Props {
  genres: Genre[];
}

export default function GenreCloud({ genres }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tagCloudRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || genres.length === 0) return;

    // Clean up any existing tag cloud more safely
    try {
      if (tagCloudRef.current) {
        tagCloudRef.current.destroy();
        tagCloudRef.current = null;
      }
    } catch (e) {
      console.warn('Error cleaning up previous tag cloud:', e);
    }

    // Clear the container manually
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Prepare the texts and corresponding sizes
    const texts = genres.map(g => g.name);
    const counts = genres.map(g => g.count);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    
    // Calculate radius based on container size
    const radius = Math.min(window.innerWidth, window.innerHeight) / 3.5;

    try {
      tagCloudRef.current = TagCloud(containerRef.current, texts, {
        radius,
        maxSpeed: 'normal',
        initSpeed: 'normal',
        direction: 135,
        keep: true,
        useContainerInlineStyles: false,
        sizeMin: 10,
        sizeMax: 60,
        useHTML: false,
      });

      // Update sizes based on genre counts with more moderate scaling
      const tags = containerRef.current.querySelectorAll('span');
      tags.forEach((tag, index) => {
        // Slightly less dramatic size scaling
        const normalizedCount = (counts[index] - minCount) / (maxCount - minCount);
        const size = Math.pow(normalizedCount, 0.4) * 50 + 10; // More moderate scaling
        
        tag.style.fontSize = `${size}px`;
        // Slightly reduced glow effect
        const glowIntensity = Math.min(size / 45, 1.2);
        tag.style.textShadow = `0 0 ${10 * glowIntensity}px rgba(255, 255, 255, ${0.35 * glowIntensity})`;
        
        // Slightly reduced weight variation
        tag.style.fontWeight = Math.min(Math.floor(normalizedCount * 300 + 400), 600).toString();
      });
    } catch (e) {
      console.error('Error creating tag cloud:', e);
    }

    // Cleanup function
    return () => {
      try {
        if (tagCloudRef.current) {
          tagCloudRef.current.destroy();
          tagCloudRef.current = null;
        }
      } catch (e) {
        console.warn('Error during cleanup:', e);
      }
      // Ensure container is cleared
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [genres]); // Re-run when genres change

  return (
    <div 
      ref={containerRef} 
      className="tagcloud w-full h-[500px] flex items-center justify-center text-white"
      style={{
        padding: '16px',
        userSelect: 'none',
      }}
    />
  );
}