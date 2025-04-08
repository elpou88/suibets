import React, { useEffect, useRef } from 'react';
import { useBetting } from '@/context/BettingContext';

interface LiveImageOverlaysProps {
  imageSrc: string;
}

/**
 * This component creates clickable areas on top of live sports image interfaces
 * without modifying the original design. It allows users to click directly on
 * teams/odds shown in the image to place bets.
 */
export const LiveImageOverlays: React.FC<LiveImageOverlaysProps> = ({ imageSrc }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const { addBet } = useBetting();
  
  useEffect(() => {
    // Create image map for betting clicks based on image src
    const imageMap = document.createElement('map');
    imageMap.name = 'live-betting-map';
    
    // Add the image map to the DOM
    document.body.appendChild(imageMap);
    
    // If the image has loaded, connect it to the map
    if (imageRef.current) {
      imageRef.current.useMap = '#live-betting-map';
    }
    
    // Set up the clickable areas based on the image being used
    setupClickableAreas(imageMap, imageSrc);
    
    return () => {
      // Clean up the image map when component unmounts
      document.body.removeChild(imageMap);
    };
  }, [imageSrc]);
  
  // Handle clicking on a betting option in the image
  const handleBetClick = (
    selectionName: string,
    odds: number,
    market: string
  ) => {
    // Generate a unique ID for this bet
    const betId = `live-${market}-${selectionName}-${Date.now()}`;
    
    // Create a mockup event ID for live events (specific logic would depend on the API)
    const liveEventId = 1000 + Math.floor(Math.random() * 100);
    
    // Add the bet to the betslip
    addBet({
      id: betId,
      eventId: liveEventId,
      eventName: `Live: ${selectionName.split(' ')[0]} match`,
      selectionName,
      odds,
      stake: 10, // Default stake amount
      market,
      isLive: true
    });
    
    // Provide visual feedback that the bet was added
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = `Added ${selectionName} @ ${odds} to Bet Slip`;
    feedbackElement.style.position = 'fixed';
    feedbackElement.style.bottom = '20px';
    feedbackElement.style.right = '20px';
    feedbackElement.style.backgroundColor = 'rgba(0, 255, 0, 0.8)';
    feedbackElement.style.color = 'white';
    feedbackElement.style.padding = '10px';
    feedbackElement.style.borderRadius = '5px';
    feedbackElement.style.zIndex = '9999';
    
    document.body.appendChild(feedbackElement);
    
    setTimeout(() => {
      document.body.removeChild(feedbackElement);
    }, 2000);
  };
  
  // Set up the clickable areas on the image map
  const setupClickableAreas = (mapElement: HTMLMapElement, src: string) => {
    // Clear any existing areas
    mapElement.innerHTML = '';
    
    // Different clickable areas based on the image being shown
    // These coordinates would need to be adjusted based on the actual images
    
    // Define common coordinates for different live page images
    if (src.includes('Live') || src.includes('live')) {
      // Add click areas for the top tennis match
      const area1 = document.createElement('area');
      area1.shape = 'rect';
      area1.coords = '289,250,305,270';
      area1.alt = 'Arthur Fils';
      area1.addEventListener('click', () => {
        handleBetClick('Arthur Fils', 1.57, 'Match Winner');
      });
      mapElement.appendChild(area1);
      
      const area2 = document.createElement('area');
      area2.shape = 'rect';
      area2.coords = '289,270,305,290';
      area2.alt = 'Pablo Carreno';
      area2.addEventListener('click', () => {
        handleBetClick('Pablo Carreno', 2.42, 'Match Winner');
      });
      mapElement.appendChild(area2);
      
      // Add click areas for the bottom tennis match
      const area3 = document.createElement('area');
      area3.shape = 'rect';
      area3.coords = '779,370,785,375';
      area3.alt = 'Alex M Pujolas';
      area3.addEventListener('click', () => {
        handleBetClick('Alex M Pujolas', 1.07, 'Match Winner');
      });
      mapElement.appendChild(area3);
      
      const area4 = document.createElement('area');
      area4.shape = 'rect';
      area4.coords = '779,385,785,390';
      area4.alt = 'Dominik Kellovsky';
      area4.addEventListener('click', () => {
        handleBetClick('Dominik Kellovsky', 6.96, 'Match Winner');
      });
      mapElement.appendChild(area4);
      
      // Add click areas for handicap bets
      const area5 = document.createElement('area');
      area5.shape = 'rect';
      area5.coords = '842,370,857,375';
      area5.alt = 'Pujolas Handicap';
      area5.addEventListener('click', () => {
        handleBetClick('Alex M Pujolas -3.5', 1.57, 'Handicap');
      });
      mapElement.appendChild(area5);
      
      const area6 = document.createElement('area');
      area6.shape = 'rect';
      area6.coords = '842,385,857,390';
      area6.alt = 'Kellovsky Handicap';
      area6.addEventListener('click', () => {
        handleBetClick('Dominik Kellovsky +3.5', 2.25, 'Handicap');
      });
      mapElement.appendChild(area6);
      
      // Add click areas for total bets
      const area7 = document.createElement('area');
      area7.shape = 'rect';
      area7.coords = '915,370,945,375';
      area7.alt = 'Over 22.5';
      area7.addEventListener('click', () => {
        handleBetClick('Over 22.5', 2.20, 'Total');
      });
      mapElement.appendChild(area7);
      
      const area8 = document.createElement('area');
      area8.shape = 'rect';
      area8.coords = '915,385,945,390';
      area8.alt = 'Under 22.5';
      area8.addEventListener('click', () => {
        handleBetClick('Under 22.5', 1.61, 'Total');
      });
      mapElement.appendChild(area8);
    }
    
    // Add more conditions for other sport-specific images
    if (src.includes('Sports_1') || src.includes('sports_1')) {
      // Soccer odds
      const area1 = document.createElement('area');
      area1.shape = 'rect';
      area1.coords = '289,190,305,210';
      area1.alt = 'Arsenal';
      area1.addEventListener('click', () => {
        handleBetClick('Arsenal', 1.45, 'Match Winner');
      });
      mapElement.appendChild(area1);
      
      const area2 = document.createElement('area');
      area2.shape = 'rect';
      area2.coords = '289,210,305,230';
      area2.alt = 'Tottenham';
      area2.addEventListener('click', () => {
        handleBetClick('Tottenham', 2.85, 'Match Winner');
      });
      mapElement.appendChild(area2);
    }
    
    if (src.includes('Sports_2') || src.includes('Sports 2')) {
      // Basketball odds
      const area1 = document.createElement('area');
      area1.shape = 'rect';
      area1.coords = '289,190,305,210';
      area1.alt = 'Lakers';
      area1.addEventListener('click', () => {
        handleBetClick('Lakers', 1.60, 'Match Winner');
      });
      mapElement.appendChild(area1);
      
      const area2 = document.createElement('area');
      area2.shape = 'rect';
      area2.coords = '289,210,305,230';
      area2.alt = 'Warriors';
      area2.addEventListener('click', () => {
        handleBetClick('Warriors', 2.45, 'Match Winner');
      });
      mapElement.appendChild(area2);
    }
    
    // Add general click handler for the entire image
    const fullImageArea = document.createElement('area');
    fullImageArea.shape = 'default';
    fullImageArea.addEventListener('click', (e) => {
      const rect = imageRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate click position relative to the image
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      console.log(`Click coordinates: ${x}, ${y}`);
      
      // Define regions on the image as clickable for betting
      // These would need adjustment based on the actual image
      
      // Left section - might be home team
      if (x < rect.width * 0.33) {
        if (y < rect.height * 0.3) {
          handleBetClick('Home Team 1', 1.80, 'Match Winner');
        } else if (y < rect.height * 0.6) {
          handleBetClick('Home Team 2', 1.95, 'Match Winner');
        } else {
          handleBetClick('Home Team 3', 2.10, 'Match Winner');
        }
      }
      // Center section - might be draw
      else if (x < rect.width * 0.66) {
        if (y < rect.height * 0.3) {
          handleBetClick('Draw 1', 3.50, 'Match Winner');
        } else if (y < rect.height * 0.6) {
          handleBetClick('Draw 2', 3.25, 'Match Winner');
        } else {
          handleBetClick('Draw 3', 3.40, 'Match Winner');
        }
      }
      // Right section - might be away team
      else {
        if (y < rect.height * 0.3) {
          handleBetClick('Away Team 1', 4.20, 'Match Winner');
        } else if (y < rect.height * 0.6) {
          handleBetClick('Away Team 2', 3.90, 'Match Winner');
        } else {
          handleBetClick('Away Team 3', 4.50, 'Match Winner');
        }
      }
    });
    mapElement.appendChild(fullImageArea);
    
    console.log(`Set up clickable betting areas for image: ${src}`);
  };
  
  // This component renders an invisible image reference to connect the map
  return (
    <img 
      ref={imageRef}
      src={imageSrc}
      style={{ display: 'none' }}
      alt="Live betting map reference"
    />
  );
};

export default LiveImageOverlays;