import React from "react";
import Layout from "@/components/layout/Layout";
import sports1Img from "@assets/Sports 1 (2).png";
import { useBetting } from '@/context/BettingContext';

export default function SportsPage() {
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
          src={sports1Img} 
          alt="Sports Page" 
          className="w-full h-auto object-contain"
          useMap="#sportsPageMap"
          onClick={handleImageClick}
        />
        
        {/* This map allows specific areas of the image to be clickable */}
        <map name="sportsPageMap">
          {/* Example clickable area for a betting button */}
          <area 
            shape="rect" 
            coords="400,200,500,250" 
            alt="Place Bet"
            onClick={() => {
              // Example bet placement
              addBet({
                id: "example_bet",
                eventId: 1,
                eventName: "Arsenal vs Manchester United",
                market: "1X2",
                marketId: 1,
                selectionName: "Arsenal",
                odds: 2.1,
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