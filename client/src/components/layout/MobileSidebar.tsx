import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Sport } from "@/types";
import { Menu, Grid2X2 } from "lucide-react";
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

export default function MobileSidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
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
        return <MdSportsSoccer className="h-5 w-5 mr-2" />;
      case 'basketball':
        return <MdSportsBasketball className="h-5 w-5 mr-2" />;
      case 'tennis':
        return <MdSportsTennis className="h-5 w-5 mr-2" />;
      case 'baseball':
        return <MdSportsBaseball className="h-5 w-5 mr-2" />;
      case 'boxing':
        return <FaFistRaised className="h-5 w-5 mr-2" />;
      case 'hockey':
        return <MdSportsHockey className="h-5 w-5 mr-2" />;
      case 'esports':
        return <MdSportsEsports className="h-5 w-5 mr-2" />;
      case 'mma-ufc':
        return <FaFistRaised className="h-5 w-5 mr-2" />;
      case 'volleyball':
        return <MdSportsVolleyball className="h-5 w-5 mr-2" />;
      case 'table-tennis':
        return <FaTableTennis className="h-5 w-5 mr-2" />;
      case 'rugby-league':
      case 'rugby-union':
        return <MdSportsRugby className="h-5 w-5 mr-2" />;
      case 'cricket':
        return <MdSportsCricket className="h-5 w-5 mr-2" />;
      case 'horse-racing':
        return <FaHorse className="h-5 w-5 mr-2" />;
      case 'greyhounds':
        return <FaDog className="h-5 w-5 mr-2" />;
      case 'afl':
        return <FaShieldAlt className="h-5 w-5 mr-2" />;
      default:
        return <Grid2X2 className="h-5 w-5 mr-2" />;
    }
  };

  const handleNavigation = (path: string) => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-secondary text-white w-64">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center">
            <span className="text-2xl font-bold text-primary">SuiBets</span>
          </div>
          
          {/* Navigation */}
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
                onClick={() => handleNavigation('/')}
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
                  onClick={() => handleNavigation(`/sport/${sport.slug}`)}
                >
                  {getSportIcon(sport.slug)}
                  {sport.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
