import React from 'react';
import Layout from '@/components/layout/Layout';
import promotionsImg from "@assets/Promotions (2).png";
import { useLocation } from "wouter";

export default function PromotionsPage() {
  const [, setLocation] = useLocation();

  // Function to handle image clicks for joining promotions
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    // Get coordinates from click event
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    
    console.log("Click coordinates:", x, y);
    
    // You can add logic here to map specific coordinates to promotion actions
    // This would allow the image to function for promotion signups while keeping the exact UI
  };

  // Function to handle joining a promotion via the image map
  const handleJoinPromotion = (promoId: number) => {
    console.log(`Joining promotion ${promoId}`);
    setLocation("/join");
  };

  return (
    <Layout>
      <div className="w-full min-h-screen bg-[#f2f2f2] flex justify-center">
        <img 
          src={promotionsImg} 
          alt="Promotions Page" 
          className="w-full h-auto object-contain"
          useMap="#promotionsPageMap"
          onClick={handleImageClick}
        />
        
        {/* This map allows specific areas of the image to be clickable */}
        <map name="promotionsPageMap">
          {/* First promotion join button */}
          <area 
            shape="rect" 
            coords="205,400,250,430" 
            alt="Join First Promotion"
            onClick={() => handleJoinPromotion(1)}
          />
          
          {/* Second promotion join button */}
          <area 
            shape="rect" 
            coords="450,400,510,430" 
            alt="Join Second Promotion"
            onClick={() => handleJoinPromotion(2)}
          />
          
          {/* Third promotion join button */}
          <area 
            shape="rect" 
            coords="705,400,760,430" 
            alt="Join Third Promotion"
            onClick={() => handleJoinPromotion(3)}
          />
        </map>
      </div>
    </Layout>
  );
}