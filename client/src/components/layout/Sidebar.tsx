import { useEffect, useState } from "react";
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
  const [activeSport, setActiveSport] = useState("upcoming");
  
  const { data: apiSports = [] } = useQuery<Sport[]>({
    queryKey: ['/api/sports']
  });
  
  // Use our static list for consistent display
  const sports = sportsList;

  // Set active sport based on path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '/sports') {
      setActiveSport('upcoming');
    } else if (path.startsWith('/sport/')) {
      const sportSlug = path.replace('/sport/', '');
      setActiveSport(sportSlug);
      console.log('Sport slug detected in URL:', sportSlug);
    }
  }, [window.location.pathname]); // Update when the pathname changes

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
      {/* Logo */}
      <div className="py-4 px-4 flex items-center justify-between border-b border-[#123040]">
        <a href="/">
          <img 
            src="/logo/suibets-logo.svg" 
            alt="SuiBets Logo" 
            className="h-8 cursor-pointer"
          />
        </a>
      </div>
      
      {/* Sports navigation - simplified with direct anchor links */}
      <div className="flex-grow overflow-y-auto no-scrollbar py-2">
        {/* Home/Upcoming */}
        <a href="/" className="block">
          <div className={`flex items-center px-4 py-3 cursor-pointer ${
            activeSport === 'upcoming' ? 'text-cyan-400' : 'text-white hover:text-cyan-400'
          }`}>
            <div className="w-8 h-8 mr-3 flex items-center justify-center">
              {getSportIcon('grid')}
            </div>
            <span className={activeSport === 'upcoming' ? 'font-medium' : ''}>
              Upcoming
            </span>
          </div>
        </a>
        
        {/* Esports - Special handling */}
        <a href="/attached_assets/image_1743933557700.png" className="block">
          <div className="flex items-center px-4 py-3 cursor-pointer bg-cyan-400 text-black my-2">
            <div className="w-8 h-8 mr-3 flex items-center justify-center">
              {getSportIcon('esports')}
            </div>
            <span>Esports</span>
          </div>
        </a>
        
        {/* Other sports */}
        {sports.filter(sport => sport.slug !== 'upcoming' && sport.slug !== 'esports').map((sport) => (
          <a 
            key={sport.id} 
            href={`/sport/${sport.slug}`} 
            className="block"
          >
            <div className={`flex items-center px-4 py-3 cursor-pointer ${
              activeSport === sport.slug ? 'text-cyan-400' : 'text-white hover:text-cyan-400'
            }`}>
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                {getSportIcon(sport.icon)}
              </div>
              <span className={activeSport === sport.slug ? 'font-medium' : ''}>
                {sport.name}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}