import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sport } from "@/types";
import { Grid2X2 } from "lucide-react";
import { 
  MdSportsBaseball, 
  MdSportsBasketball, 
  MdSportsSoccer, 
  MdSportsTennis, 
  MdSportsHockey, 
  MdSportsEsports, 
  MdSportsRugby, 
  MdSportsCricket, 
  MdSportsHandball,
  MdSportsVolleyball
} from "react-icons/md";
import {
  FaFistRaised,
  FaHorse,
  FaDog,
  FaShieldAlt,
  FaTableTennis
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar() {
  const [location] = useLocation();
  const [activeSport, setActiveSport] = useState("upcoming");
  
  const { data: sports = [] } = useQuery<Sport[]>({
    queryKey: ['/api/sports']
  });

  useEffect(() => {
    // Extract the current sport from the location
    const path = location.split('?')[0];
    if (path === '/') {
      setActiveSport('upcoming');
    } else if (path.startsWith('/sport/')) {
      setActiveSport(path.replace('/sport/', ''));
    }
  }, [location]);

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'football':
        return <MdSportsSoccer className="h-5 w-5" />;
      case 'basketball':
        return <MdSportsBasketball className="h-5 w-5" />;
      case 'tennis':
        return <MdSportsTennis className="h-5 w-5" />;
      case 'baseball':
        return <MdSportsBaseball className="h-5 w-5" />;
      case 'boxing':
        return <FaFistRaised className="h-5 w-5" />;
      case 'hockey':
        return <MdSportsHockey className="h-5 w-5" />;
      case 'esports':
        return <MdSportsEsports className="h-5 w-5" />;
      case 'mma-ufc':
        return <FaFistRaised className="h-5 w-5" />;
      case 'volleyball':
        return <MdSportsVolleyball className="h-5 w-5" />;
      case 'table-tennis':
        return <FaTableTennis className="h-5 w-5" />;
      case 'rugby-league':
      case 'rugby-union':
        return <MdSportsRugby className="h-5 w-5" />;
      case 'cricket':
        return <MdSportsCricket className="h-5 w-5" />;
      case 'horse-racing':
        return <FaHorse className="h-5 w-5" />;
      case 'greyhounds':
        return <FaDog className="h-5 w-5" />;
      case 'afl':
        return <FaShieldAlt className="h-5 w-5" />;
      default:
        return <Grid2X2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="hidden md:flex flex-col w-64 bg-[#032F36] text-white">
      {/* Logo */}
      <div className="py-6 px-6 flex items-center">
        <span className="sui-logo">SuiBets</span>
      </div>
      
      {/* Main navigation */}
      <div className="flex-grow overflow-y-auto scrollbar-hidden space-y-1">
        {/* Upcoming */}
        <Link href="/">
          <div 
            className={`flex items-center px-4 py-3 mx-2 rounded ${
              activeSport === 'upcoming' 
                ? 'bg-primary text-black' 
                : 'text-white hover:bg-[#042A30]'
            }`}
          >
            <div className="w-8 h-8 mr-3 flex items-center justify-center">
              <Grid2X2 className="h-5 w-5" />
            </div>
            <span className={activeSport === 'upcoming' ? 'font-semibold' : ''}>Upcoming</span>
          </div>
        </Link>

        {/* Sports categories */}
        {sports.map((sport) => (
          <Link key={sport.id} href={`/sport/${sport.slug}`}>
            <div
              className={`flex items-center px-4 py-3 mx-2 rounded ${
                activeSport === sport.slug 
                  ? 'bg-primary text-black' 
                  : 'text-white hover:bg-[#042A30]'
              }`}
            >
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                {getSportIcon(sport.slug)}
              </div>
              <span className={activeSport === sport.slug ? 'font-semibold' : ''}>{sport.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
