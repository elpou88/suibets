import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import Match from "@/pages/match";
import Sport from "@/pages/sport";
import MatchDetail from "@/pages/match-detail";
import Promotions from "@/pages/promotions";
import ReferralPage from "@/pages/promotions/referral";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import BetHistory from "@/pages/bet-history";
import BetSlip from "@/pages/bet-slip";
import BetSlip2 from "@/pages/bet-slip-2";
import ConnectWallet from "@/pages/connect-wallet";
import NotFound from "@/pages/not-found";
import RedirectToPromotions from "@/pages/redirect-to-promotions";
import RedirectToLive from "@/pages/redirect-to-live";
import { AuthProvider } from "@/context/AuthContext";
import { BettingProvider } from "@/context/BettingContext";
import { WalProvider } from "@/components/ui/wal-components";
import { SpecialLinks } from "@/components/ui/SpecialLinks";
import Info from "@/pages/info";
import Community from "@/pages/community";
import Contact from "@/pages/contact";
import LiveEventPage from "@/pages/live/[id]";
import Live from "@/pages/live";
import NavigationBar from "@/components/layout/NavigationBar";
import Footer from "@/components/layout/Footer";
import { useMobile } from "@/hooks/use-mobile";
import { Grid2X2, Home as HomeIcon, User } from "lucide-react";
import { BiFootball } from "react-icons/bi";
import { Link } from "wouter";
import { useEffect, useState } from "react";
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

function AppSidebar() {
  const [activeSport, setActiveSport] = useState("upcoming");
  
  // Set active sport based on path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '/sports') {
      setActiveSport('upcoming');
    } else if (path.startsWith('/sport/')) {
      const sportSlug = path.replace('/sport/', '');
      setActiveSport(sportSlug);
    }
  }, []);

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
        <a href="/sport/esports" className="block">
          <div className="flex items-center px-4 py-3 cursor-pointer bg-cyan-400 text-black my-2">
            <div className="w-8 h-8 mr-3 flex items-center justify-center">
              {getSportIcon('esports')}
            </div>
            <span>Esports</span>
          </div>
        </a>
        
        {/* Other sports */}
        {sportsList.filter(sport => sport.slug !== 'upcoming' && sport.slug !== 'esports').map((sport) => (
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

function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop */}
      {!isMobile && <AppSidebar />}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#09181B] text-white z-30 flex justify-around p-2 border-t border-[#112225]">
          <Link href="/" className="p-2 flex flex-col items-center justify-center">
            <HomeIcon className="h-6 w-6 text-[#00FFFF]" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/sports" className="p-2 flex flex-col items-center justify-center">
            <BiFootball className="h-6 w-6" />
            <span className="text-xs mt-1">Sports</span>
          </Link>
          <Link href="/live" className="p-2 flex flex-col items-center justify-center">
            <Grid2X2 className="h-6 w-6" />
            <span className="text-xs mt-1">Live</span>
          </Link>
          <Link href="/settings" className="p-2 flex flex-col items-center justify-center">
            <User className="h-6 w-6" />
            <span className="text-xs mt-1">Account</span>
          </Link>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-[#09181B]">
        <NavigationBar />
        <main className="flex-1 p-4 overflow-y-auto pb-20 md:pb-4 bg-[#09181B] text-white">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

function AppRouter() {
  console.log("Router initialized");
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sports" component={Home} />
      <Route path="/sport/:slug*" component={Sport} />
      <Route path="/match/:id" component={Match} />
      <Route path="/match-detail/:id" component={MatchDetail} />
      <Route path="/promotions" component={Promotions} />
      <Route path="/promotions/referral" component={ReferralPage} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      <Route path="/bet-history" component={BetHistory} />
      <Route path="/bet-slip" component={BetSlip} />
      <Route path="/bet-slip-2" component={BetSlip2} />
      <Route path="/connect-wallet" component={ConnectWallet} />
      <Route path="/join" component={Home} />
      <Route path="/goto-promotions" component={RedirectToPromotions} />
      <Route path="/goto-live" component={RedirectToLive} />
      <Route path="/info" component={Info} />
      <Route path="/community" component={Community} />
      <Route path="/contact" component={Contact} />
      <Route path="/live" component={Live} />
      <Route path="/live/:id" component={LiveEventPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalProvider>
        <AuthProvider>
          <BettingProvider>
            <AppLayout>
              <AppRouter />
            </AppLayout>
            <SpecialLinks />
            <Toaster />
          </BettingProvider>
        </AuthProvider>
      </WalProvider>
    </QueryClientProvider>
  );
}

export default App;
