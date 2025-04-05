import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Sport } from "@/types";
import { 
  Menu, 
  Activity,
  CircleDotDashed,
  Bike,
  Trophy,
  Zap,
  Monitor, 
  Users, 
  UserRound,
  Tablet, 
  Flag, 
  Bug, 
  CircleEllipsis,
  CircleOff,
  Shield,
  Grid2X2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function MobileSidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [activeSport, setActiveSport] = useState("upcoming");
  
  const { data: sports = [] } = useQuery<Sport[]>({
    queryKey: ['/api/sports']
  });

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
        return <Activity className="h-5 w-5 mr-2" />;
      case 'greyhounds':
        return <CircleOff className="h-5 w-5 mr-2" />;
      case 'afl':
        return <Shield className="h-5 w-5 mr-2" />;
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
