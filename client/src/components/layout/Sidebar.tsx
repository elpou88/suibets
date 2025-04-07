import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sport } from "@/types";
import { Grid2X2, ChevronLeft, LineChart } from "lucide-react";
import { 
  MdSportsBaseball, 
  MdSportsBasketball, 
  MdSportsSoccer, 
  MdSportsTennis, 
  MdSportsHockey, 
  MdSportsEsports, 
  MdSportsRugby, 
  MdSportsCricket, 
  MdSportsVolleyball
} from "react-icons/md";
import {
  FaFistRaised,
  FaHorse,
  FaTableTennis
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";

// Static list of sports to match the screenshot
const sportsList = [
  { id: 1, name: 'Upcoming', slug: 'upcoming', icon: 'grid' },
  { id: 2, name: 'Football', slug: 'football', icon: 'soccer' },
  { id: 3, name: 'Basketball', slug: 'basketball', icon: 'basketball' },
  { id: 4, name: 'Tennis', slug: 'tennis', icon: 'tennis' },
  { id: 5, name: 'Baseball', slug: 'baseball', icon: 'baseball' },
  { id: 6, name: 'Boxing', slug: 'boxing', icon: 'boxing' },
  { id: 7, name: 'Hockey', slug: 'hockey', icon: 'hockey' },
  { id: 8, name: 'Esports', slug: 'esports', icon: 'esports' },
  { id: 9, name: 'MMA / UFC', slug: 'mma-ufc', icon: 'mma' },
  { id: 10, name: 'Volleyball', slug: 'volleyball', icon: 'volleyball' },
  { id: 11, name: 'Table Tennis', slug: 'table-tennis', icon: 'tabletennis' },
  { id: 12, name: 'Rugby League', slug: 'rugby-league', icon: 'rugby' },
  { id: 13, name: 'Rugby Union', slug: 'rugby-union', icon: 'rugby' },
  { id: 14, name: 'Cricket', slug: 'cricket', icon: 'cricket' },
  { id: 15, name: 'Horse Racing', slug: 'horse-racing', icon: 'horse' }
];

export default function Sidebar() {
  const [location] = useLocation();
  const [activeSport, setActiveSport] = useState("upcoming");
  
  const { data: apiSports = [] } = useQuery<Sport[]>({
    queryKey: ['/api/sports']
  });
  
  // Use our static list for consistent display
  const sports = sportsList;

  useEffect(() => {
    // Extract the current sport from the location
    const path = location.split('?')[0];
    if (path === '/') {
      setActiveSport('upcoming');
    } else if (path.startsWith('/sport/')) {
      const sportSlug = path.replace('/sport/', '');
      setActiveSport(sportSlug);
      console.log('Sport slug detected in URL:', sportSlug);
    }
  }, [location]);

  const getSportIcon = (iconType: string) => {
    switch (iconType) {
      case 'grid':
        return <Grid2X2 size={24} />;
      case 'soccer':
        return <MdSportsSoccer size={24} />;
      case 'basketball':
        return <MdSportsBasketball size={24} />;
      case 'tennis':
        return <MdSportsTennis size={24} />;
      case 'baseball':
        return <MdSportsBaseball size={24} />;
      case 'boxing':
        return <FaFistRaised size={24} />;
      case 'hockey':
        return <MdSportsHockey size={24} />;
      case 'esports':
        return <MdSportsEsports size={24} />;
      case 'mma':
        return <FaFistRaised size={24} />;
      case 'volleyball':
        return <MdSportsVolleyball size={24} />;
      case 'tabletennis':
        return <FaTableTennis size={24} />;
      case 'rugby':
        return <MdSportsRugby size={24} />;
      case 'cricket':
        return <MdSportsCricket size={24} />;
      case 'horse':
        return <FaHorse size={24} />;
      default:
        return <Grid2X2 size={24} />;
    }
  };

  return (
    <div className="flex flex-col w-64 bg-[#09151A] text-white h-full">
      {/* Logo only - removed arrow as requested */}
      <div className="py-4 px-4 flex items-center justify-between border-b border-[#123040]">
        <img 
          src="/logo/suibets-logo.svg" 
          alt="SuiBets Logo" 
          className="h-8"
        />
      </div>
      
      {/* Sports navigation - matching the design in the screenshot */}
      <div className="flex-grow overflow-y-auto no-scrollbar py-2">
        {sports.map((sport) => (
          <a 
            key={sport.id}
            href={sport.slug === 'upcoming' ? '/' : `/sport/${sport.slug}`}
            className="block"
            onClick={(e) => {
              console.log(`Clicking on ${sport.name} (${sport.slug})`);
              
              // Special handling for Esports - similar to what we did for Promotions
              if (sport.slug === 'esports') {
                e.preventDefault();
                const win = window.open('/attached_assets/image_1743933557700.png', '_self');
                if (win) {
                  win.focus();
                }
                console.log('Opening Esports image directly');
                return;
              }
            }}
          >
            <div
              className={`flex items-center px-4 py-3 cursor-pointer ${
                sport.slug === 'esports' 
                  ? 'bg-cyan-400 text-black my-2' 
                  : activeSport === sport.slug 
                    ? 'text-cyan-400' 
                    : 'text-white hover:text-cyan-400'
              }`}
            >
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                {getSportIcon(sport.icon)}
              </div>
              <span className={`${activeSport === sport.slug ? 'font-medium' : ''}`}>
                {sport.name}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}