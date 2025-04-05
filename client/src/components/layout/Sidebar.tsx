import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sport } from "@/types";
import {
  Activity,
  CircleDotDashed,
  Bike,
  CircleEllipsis,
  Zap,
  Trophy,
  Monitor,
  Users,
  UserRound,
  Tablet,
  Flag,
  Bug,
  CircleEllipsis as HorseIcon,
  CircleOff,
  Shield,
  Grid2X2
} from "lucide-react";
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
        return <Activity className="h-5 w-5 mr-2" />;
      case 'basketball':
        return <CircleDotDashed className="h-5 w-5 mr-2" />;
      case 'tennis':
        return <Bike className="h-5 w-5 mr-2" />;
      case 'baseball':
        return <CircleEllipsis className="h-5 w-5 mr-2" />;
      case 'boxing':
        return <Zap className="h-5 w-5 mr-2" />;
      case 'hockey':
        return <Trophy className="h-5 w-5 mr-2" />;
      case 'esports':
        return <Monitor className="h-5 w-5 mr-2" />;
      case 'mma-ufc':
        return <Users className="h-5 w-5 mr-2" />;
      case 'volleyball':
        return <UserRound className="h-5 w-5 mr-2" />;
      case 'table-tennis':
        return <Tablet className="h-5 w-5 mr-2" />;
      case 'rugby-league':
      case 'rugby-union':
        return <Flag className="h-5 w-5 mr-2" />;
      case 'cricket':
        return <Bug className="h-5 w-5 mr-2" />;
      case 'horse-racing':
        return <HorseIcon className="h-5 w-5 mr-2" />;
      case 'greyhounds':
        return <CircleOff className="h-5 w-5 mr-2" />;
      case 'afl':
        return <Shield className="h-5 w-5 mr-2" />;
      default:
        return <Grid2X2 className="h-5 w-5 mr-2" />;
    }
  };

  return (
    <div className="hidden md:flex flex-col w-64 bg-gradient-to-b from-secondary to-secondary text-white">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <span className="text-2xl font-bold text-primary">SuiBets</span>
      </div>
      
      {/* Main navigation */}
      <div className="flex-grow overflow-y-auto scrollbar-hidden p-4 space-y-2">
        {/* Upcoming */}
        <Link href="/">
          <Button
            variant={activeSport === 'upcoming' ? 'default' : 'ghost'}
            className={`w-full justify-start ${
              activeSport === 'upcoming' 
                ? 'bg-primary text-secondary' 
                : 'text-white hover:bg-gray-700'
            }`}
          >
            <Grid2X2 className="h-5 w-5 mr-2" />
            Upcoming
          </Button>
        </Link>

        {/* Sports categories */}
        {sports.map((sport) => (
          <Link key={sport.id} href={`/sport/${sport.slug}`}>
            <Button
              variant={activeSport === sport.slug ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeSport === sport.slug 
                  ? 'bg-primary text-secondary' 
                  : 'text-white hover:bg-gray-700'
              }`}
            >
              {getSportIcon(sport.slug)}
              {sport.name}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
