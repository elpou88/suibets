import React from 'react';
import Layout from '@/components/layout/Layout';
import liveImg from "@assets/Live (2).png";
import { useBetting } from '@/context/BettingContext';

export default function LivePage() {
  // Maintain the backend integration
  const { addBet } = useBetting();

  // Function to handle image clicks for bet placement
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    // Get coordinates from click event
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    
    console.log("Click coordinates:", x, y);
    
    // You can add logic here to map specific coordinates to bet actions
    // This would allow the image to function for betting while keeping the exact UI
  };

  return (
    <Layout>
      <div className="w-full min-h-screen bg-[#f2f2f2] flex justify-center">
        <img 
          src={liveImg} 
          alt="Live Page" 
          className="w-full h-auto object-contain"
          useMap="#livePageMap"
          onClick={handleImageClick}
        />
        
        {/* This map allows specific areas of the image to be clickable */}
        <map name="livePageMap">
          {/* Example clickable area for a betting button */}
          <area 
            shape="rect" 
            coords="400,350,450,380" 
            alt="Place Bet"
            onClick={() => {
              // Example bet placement
              addBet({
                id: "live_example_bet",
                eventId: 101,
                eventName: "Alex M Pujolas vs Dominik Kellovsky",
                market: "Match Winner",
                marketId: 1,
                selectionName: "Alex M Pujolas",
                odds: 1.57,
                stake: 10,
                currency: "SUI"
              });
            }}
          />
        </map>
      </div>
    </Layout>
  );
}