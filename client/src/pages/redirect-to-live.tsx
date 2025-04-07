import { useEffect } from "react";
import { useLocation } from "wouter";
import liveImage from "@assets/Live (2).png";

export default function RedirectToLive() {
  const [_, navigate] = useLocation();

  useEffect(() => {
    // Show the image in a full-page view
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    
    // Add a back button
    const backButton = document.createElement("button");
    backButton.innerText = "« Back to SuiBets";
    backButton.style.position = "fixed";
    backButton.style.top = "10px";
    backButton.style.left = "10px";
    backButton.style.padding = "8px 16px";
    backButton.style.background = "#00FFFF";
    backButton.style.color = "black";
    backButton.style.border = "none";
    backButton.style.borderRadius = "4px";
    backButton.style.cursor = "pointer";
    backButton.style.zIndex = "1000";
    backButton.style.fontWeight = "bold";
    
    backButton.onclick = () => {
      navigate("/");
    };
    
    document.body.appendChild(backButton);
    
    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.overflow = "";
      if (document.body.contains(backButton)) {
        document.body.removeChild(backButton);
      }
    };
  }, [navigate]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <img 
        src={liveImage} 
        alt="Live Betting" 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100vh', 
          objectFit: 'contain',
          display: 'block'
        }} 
      />
    </div>
  );
}