import { LineChart } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export function SpecialLinks() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [, navigate] = useLocation();
  
  return (
    <div className="fixed z-50 bottom-4 right-4">
      <div className="relative">
        <button 
          className="flex items-center justify-center bg-cyan-400 text-black rounded-full w-12 h-12 shadow-lg hover:bg-cyan-300 transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => navigate("/wurlus-odds")}
        >
          <LineChart size={24} />
        </button>
        
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-14 right-0 bg-black text-white px-3 py-2 rounded shadow-lg whitespace-nowrap">
            Wurlus Protocol Odds
          </div>
        )}
      </div>
    </div>
  );
}