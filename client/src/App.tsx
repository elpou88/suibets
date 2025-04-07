import { Switch, Route, useLocation } from "wouter";
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
import Sidebar from "@/components/layout/Sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { Grid2X2, Home as HomeIcon, User } from "lucide-react";
import { BiFootball } from "react-icons/bi";
import { Link } from "wouter";

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

function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const [location] = useLocation();
  
  // Home page shouldn't show the sidebar or navigation
  if (location === '/' || location === '/sports') {
    return <>{children}</>;
  }
  
  return (
    <div className="flex min-h-screen bg-[#09181B]">
      {/* Sidebar for desktop */}
      {!isMobile && <Sidebar />}
      
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

      <div className="flex-1">
        {children}
      </div>
    </div>
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
