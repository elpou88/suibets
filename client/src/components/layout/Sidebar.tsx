import { useEffect, useState } from "react";
import { Sport } from "@/types";
import { 
  Grid2X2, 
  ChevronRight, 
  ChevronDown, 
  LineChart,
  Flame
} from "lucide-react";
import { 
  MdSportsBaseball, 
  MdSportsBasketball, 
  MdSportsSoccer, 
  MdSportsTennis, 
  MdSportsHockey, 
  MdSportsEsports, 
  MdSportsRugby, 
  MdSportsCricket, 
  MdSportsVolleyball,
  MdSportsFootball
} from "react-icons/md";
import {
  FaFistRaised,
  FaHorse,
  FaTableTennis,
  FaDog,
  FaFootballBall,
  FaHandPaper,
  FaBullseye,
  FaBasketballBall,
  FaSnowboarding,
  FaBiking,
  FaMotorcycle,
  FaGolfBall
} from "react-icons/fa";
import {
  TbSteeringWheel,
  TbBike
} from "react-icons/tb";
import {
  GiTennisRacket,
  GiVolleyballBall,
  GiEightBall
} from "react-icons/gi";
import { useQuery } from "@tanstack/react-query";

// Sports organized by categories
const sportsCategories = [
  {
    name: "Main",
    sports: [
      { id: 1, name: 'Homepage', slug: 'upcoming', icon: 'grid' },
      { id: 2, name: 'Live Now', slug: 'live', icon: 'live', highlight: true },
      { id: 3, name: 'Live Scores', slug: 'live-scores', icon: 'chart' }
    ]
  },
  {
    name: "Popular Sports",
    sports: [
      { id: 3, name: 'Football', slug: 'football', icon: 'soccer' },
      { id: 4, name: 'Basketball', slug: 'basketball', icon: 'basketball' },
      { id: 5, name: 'Tennis', slug: 'tennis', icon: 'tennis' },
      { id: 6, name: 'Baseball', slug: 'baseball', icon: 'baseball' },
      { id: 7, name: 'Esports', slug: 'esports', icon: 'esports', highlight: true },
      { id: 8, name: 'Hockey', slug: 'hockey', icon: 'hockey' },
      { id: 9, name: 'American Football', slug: 'american-football', icon: 'american-football' }
    ]
  },
  {
    name: "Combat Sports",
    sports: [
      { id: 10, name: 'Boxing', slug: 'boxing', icon: 'boxing' },
      { id: 11, name: 'MMA / UFC', slug: 'mma-ufc', icon: 'mma' }
    ]
  },
  {
    name: "Team Sports",
    sports: [
      { id: 12, name: 'Volleyball', slug: 'volleyball', icon: 'volleyball' },
      { id: 13, name: 'Beach Volleyball', slug: 'beach-volleyball', icon: 'beach-volleyball' },
      { id: 14, name: 'Rugby League', slug: 'rugby-league', icon: 'rugby' },
      { id: 15, name: 'Rugby Union', slug: 'rugby-union', icon: 'rugby' },
      { id: 16, name: 'Cricket', slug: 'cricket', icon: 'cricket' },
      { id: 17, name: 'AFL', slug: 'afl', icon: 'football' },
      { id: 18, name: 'Handball', slug: 'handball', icon: 'handball' },
      { id: 19, name: 'Netball', slug: 'netball', icon: 'netball' }
    ]
  },
  {
    name: "Racquet Sports",
    sports: [
      { id: 20, name: 'Table Tennis', slug: 'table-tennis', icon: 'tabletennis' },
      { id: 21, name: 'Badminton', slug: 'badminton', icon: 'badminton' }
    ]
  },
  {
    name: "Racing",
    sports: [
      { id: 22, name: 'Horse Racing', slug: 'horse-racing', icon: 'horse' },
      { id: 23, name: 'Greyhounds', slug: 'greyhounds', icon: 'dog' },
      { id: 24, name: 'Formula 1', slug: 'formula-1', icon: 'formula1' },
      { id: 25, name: 'MotoGP', slug: 'motogp', icon: 'motogp' },
      { id: 26, name: 'Cycling', slug: 'cycling', icon: 'cycling' }
    ]
  },
  {
    name: "Other Sports",
    sports: [
      { id: 27, name: 'Snooker', slug: 'snooker', icon: 'snooker' },
      { id: 28, name: 'Darts', slug: 'darts', icon: 'darts' },
      { id: 29, name: 'Golf', slug: 'golf', icon: 'golf' },
      { id: 30, name: 'Winter Sports', slug: 'winter-sports', icon: 'winter-sports' }
    ]
  }
];

export default function Sidebar() {
  const [activeSport, setActiveSport] = useState("upcoming");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Main", "Popular Sports"]);
  
  const { data: apiSports = [] } = useQuery<Sport[]>({
    queryKey: ['/api/sports']
  });

  // Set active sport based on path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '/sports') {
      setActiveSport('upcoming');
    } else if (path.includes('/sports-live/')) {
      const sportSlug = path.split('/sports-live/')[1];
      setActiveSport(sportSlug);
      
      // Find which category contains this sport
      for (const category of sportsCategories) {
        if (category.sports.some(sport => sport.slug === sportSlug)) {
          if (!expandedCategories.includes(category.name)) {
            setExpandedCategories([...expandedCategories, category.name]);
          }
          break;
        }
      }
    }
  }, [window.location.pathname]); // Update when the pathname changes

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const getSportIcon = (iconType: string) => {
    switch (iconType) {
      case 'grid':
        return <Grid2X2 size={24} />;
      case 'live':
        return <Flame size={24} className="text-red-500" />;
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
      case 'dog':
        return <FaDog size={24} />;
      case 'football':
        return <MdSportsFootball size={24} />;
      case 'american-football':
        return <FaFootballBall size={24} />;
      case 'formula1':
        return <TbSteeringWheel size={24} />;
      case 'cycling':
        return <FaBiking size={24} />;
      case 'handball':
        return <FaHandPaper size={24} />;
      case 'snooker':
        return <GiEightBall size={24} />;
      case 'darts':
        return <FaBullseye size={24} />;
      case 'badminton':
        return <GiTennisRacket size={24} />;
      case 'netball':
        return <FaBasketballBall size={24} />;
      case 'beach-volleyball':
        return <GiVolleyballBall size={24} />;
      case 'motogp':
        return <FaMotorcycle size={24} />;
      case 'golf':
        return <FaGolfBall size={24} />;
      case 'winter-sports':
        return <FaSnowboarding size={24} />;
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
      
      {/* Sports navigation - categorized */}
      <div className="flex-grow overflow-y-auto no-scrollbar py-2">
        {sportsCategories.map((category) => (
          <div key={category.name} className="mb-2">
            {/* Category Header */}
            <div 
              className="flex items-center justify-between px-4 py-2 text-gray-400 hover:text-white cursor-pointer"
              onClick={() => toggleCategory(category.name)}
            >
              <span className="text-sm font-medium uppercase tracking-wider">{category.name}</span>
              {expandedCategories.includes(category.name) 
                ? <ChevronDown size={16} /> 
                : <ChevronRight size={16} />
              }
            </div>
            
            {/* Category Content */}
            {expandedCategories.includes(category.name) && (
              <div className="pl-2">
                {category.sports.map((sport) => {
                  const href = sport.slug === 'upcoming' 
                    ? "/" 
                    : sport.slug === 'live' 
                      ? "/live" 
                      : sport.slug === 'live-scores'
                        ? "/live-scores"
                        : `/sports-live/${sport.slug}`;
                  
                  return (
                    <a key={sport.id} href={href} className="block">
                      <div className={`flex items-center px-4 py-3 cursor-pointer rounded-md mx-1 
                        ${sport.highlight ? 'bg-[#1e3a3f] hover:bg-[#254247]' : ''}
                        ${activeSport === sport.slug 
                          ? 'text-cyan-400' 
                          : 'text-white hover:text-cyan-400 hover:bg-[#0f1d23]'
                        }`}
                      >
                        <div className="w-8 h-8 mr-3 flex items-center justify-center">
                          {getSportIcon(sport.icon)}
                        </div>
                        <span className={activeSport === sport.slug ? 'font-medium' : ''}>
                          {sport.name}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}