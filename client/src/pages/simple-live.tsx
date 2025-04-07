import { useEffect } from "react";

export default function SimpleLive() {
  useEffect(() => {
    // Redirect to sports page when button is clicked
    const handleSportsClick = () => {
      window.location.href = "/";  // Go directly to home/sports page
    };
    
    // Redirect to promotions page when button is clicked
    const handlePromotionsClick = () => {
      window.location.href = "/promotions";  // Go to promotions page
    };
    
    // Create simple buttons at the top
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.zIndex = "1000";
    container.style.padding = "10px";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    
    // Sports Button
    const sportsButton = document.createElement("button");
    sportsButton.textContent = "Sports";
    sportsButton.style.margin = "0 10px";
    sportsButton.style.padding = "5px 10px";
    sportsButton.style.borderRadius = "4px";
    sportsButton.style.backgroundColor = "#f0f0f0";
    sportsButton.style.border = "1px solid #ccc";
    sportsButton.style.cursor = "pointer";
    sportsButton.onclick = handleSportsClick;
    container.appendChild(sportsButton);
    
    // Live Button (Current page)
    const liveButton = document.createElement("button");
    liveButton.textContent = "Live";
    liveButton.style.margin = "0 10px";
    liveButton.style.padding = "5px 10px";
    liveButton.style.borderRadius = "4px";
    liveButton.style.backgroundColor = "#00c3ff";
    liveButton.style.color = "#fff";
    liveButton.style.border = "1px solid #00a0d6";
    liveButton.style.fontWeight = "bold";
    liveButton.style.cursor = "default";
    container.appendChild(liveButton);
    
    // Promotions Button
    const promotionsButton = document.createElement("button");
    promotionsButton.textContent = "Promotions";
    promotionsButton.style.margin = "0 10px";
    promotionsButton.style.padding = "5px 10px";
    promotionsButton.style.borderRadius = "4px";
    promotionsButton.style.backgroundColor = "#f0f0f0";
    promotionsButton.style.border = "1px solid #ccc";
    promotionsButton.style.cursor = "pointer";
    promotionsButton.onclick = handlePromotionsClick;
    container.appendChild(promotionsButton);
    
    // Add the buttons to the page
    document.body.appendChild(container);
    
    // Add the main image below the menu
    const contentContainer = document.createElement("div");
    contentContainer.style.marginTop = "50px";
    contentContainer.style.width = "100%";
    
    const img = document.createElement("img");
    img.src = "/images/live_actual.png";
    img.alt = "Live Page";
    img.style.width = "100%";
    
    contentContainer.appendChild(img);
    document.body.appendChild(contentContainer);
    
    // Clean up
    return () => {
      document.body.removeChild(container);
      document.body.removeChild(contentContainer);
    };
  }, []);
  
  return null;
}