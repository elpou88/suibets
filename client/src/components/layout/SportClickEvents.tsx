import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sport } from '@/types';

/**
 * This component applies direct navigation handlers to specific sport areas in the UI
 * It works by intercepting clicks and then programmatically navigating
 */
export default function SportClickEvents() {
  const [, setLocation] = useLocation();

  // Query the API for sports to ensure we have the correct slugs
  const { data: sports = [] } = useQuery<Sport[]>({
    queryKey: ['/api/sports']
  });

  useEffect(() => {
    // Create a mapping from DOM element position to sport slugs
    const createSportMapping = () => {
      // Map out the static position zones in the sidebar for sports
      const sportZones = [
        { name: 'Football', top: 130, bottom: 150, slug: 'football' },
        { name: 'Basketball', top: 170, bottom: 190, slug: 'basketball' },
        { name: 'Tennis', top: 210, bottom: 230, slug: 'tennis' },
        { name: 'Baseball', top: 250, bottom: 270, slug: 'baseball' },
        { name: 'Boxing', top: 290, bottom: 310, slug: 'boxing' },
        { name: 'Hockey', top: 330, bottom: 350, slug: 'hockey' },
        { name: 'Esports', top: 370, bottom: 390, slug: 'esports' },
        { name: 'MMA/UFC', top: 410, bottom: 430, slug: 'mma-ufc' },
        { name: 'Volleyball', top: 450, bottom: 470, slug: 'volleyball' },
        { name: 'Table Tennis', top: 490, bottom: 510, slug: 'table-tennis' },
        { name: 'Rugby League', top: 530, bottom: 550, slug: 'rugby-league' },
        { name: 'Rugby Union', top: 570, bottom: 590, slug: 'rugby-union' },
        { name: 'Cricket', top: 610, bottom: 630, slug: 'cricket' },
        { name: 'Horse Racing', top: 650, bottom: 670, slug: 'horse-racing' },
        { name: 'Greyhounds', top: 690, bottom: 710, slug: 'greyhounds' },
        { name: 'AFL', top: 730, bottom: 750, slug: 'afl' }
      ];

      // Override with slugs from the API if available
      if (sports.length > 0) {
        sports.forEach((sport, index) => {
          if (index < sportZones.length) {
            sportZones[index].slug = sport.slug;
          }
        });
      }

      return sportZones;
    };
    
    // Create a global click handler function that directly listens to all clicks
    const globalClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // If the click is on a link with an href, log it for debugging
      const closestAnchor = target.closest('a');
      if (closestAnchor) {
        const href = closestAnchor.getAttribute('href');
        
        // If this is a sport link, prevent default and handle it
        if (href && href.startsWith('/sport/')) {
          e.preventDefault();
          console.log(`Intercepted click on sport link: ${href}`);
          setLocation(href);
          return;
        }
      }
      
      // Check if click was in the sidebar area (left ~15% of the screen)
      const x = e.clientX;
      const y = e.clientY;
      const windowWidth = window.innerWidth;
      
      // Consider the click in the sidebar if it's within the first 20% of the screen width
      if (x < windowWidth * 0.2) {
        // Get our sport mapping
        const sportZones = createSportMapping();
        
        // Check each sport zone to see if the click falls within it
        for (const zone of sportZones) {
          // Calculate the pixel positions based on percentages of viewport height
          const viewportHeight = window.innerHeight;
          const topPx = (zone.top / 100) * viewportHeight;
          const bottomPx = (zone.bottom / 100) * viewportHeight;
          
          if (y >= topPx && y <= bottomPx) {
            console.log(`Clicked on sport: ${zone.name} (${zone.slug}) in sidebar zone`);
            setLocation(`/sport/${zone.slug}`);
            return;
          }
        }
      }
    };

    // Add the global click handler
    document.addEventListener('click', globalClickHandler);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', globalClickHandler);
    };
  }, [setLocation, sports]);

  return null; // This component doesn't render anything
}