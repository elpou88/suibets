import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Import our simplified pages with direct image rendering
import SportsPage from "@/pages/sports-page";
import LivePage from "@/pages/live-page";
import PromotionsPage from "@/pages/promotions-page";

// Keep other page imports but we'll use our new ones for main navigation
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
import { AuthProvider } from "@/context/AuthContext";
import { BettingProvider } from "@/context/BettingContext";
import { WalProvider } from "@/components/ui/wal-components";
import { SpecialLinks } from "@/components/ui/SpecialLinks";
import Info from "@/pages/info";
import Community from "@/pages/community";
import Contact from "@/pages/contact";

function App() {
  // Initializing the application
  
  return (
    <QueryClientProvider client={queryClient}>
      <WalProvider>
        <AuthProvider>
          <BettingProvider>
            <div className="root-container">
              <Switch>
                <Route path="/" component={SportsPage} />
                <Route path="/sports" component={SportsPage} />
                <Route path="/sport/:slug*" component={Sport} />
                <Route path="/match/:id" component={Match} />
                <Route path="/match-detail/:id" component={MatchDetail} />
                <Route path="/promotions" component={PromotionsPage} />
                <Route path="/notifications" component={Notifications} />
                <Route path="/settings" component={Settings} />
                <Route path="/bet-history" component={BetHistory} />
                <Route path="/bet-slip" component={BetSlip} />
                <Route path="/bet-slip-2" component={BetSlip2} />
                <Route path="/connect-wallet" component={ConnectWallet} />
                <Route path="/join" component={Home} />
                <Route path="/goto-sports" component={SportsPage} />
                <Route path="/goto-promotions" component={PromotionsPage} />
                <Route path="/goto-live" component={LivePage} />
                <Route path="/info" component={Info} />
                <Route path="/community" component={Community} />
                <Route path="/contact" component={Contact} />
                <Route path="/live" component={LivePage} />
                <Route component={NotFound} />
              </Switch>
            </div>
            <SpecialLinks />
            <Toaster />
          </BettingProvider>
        </AuthProvider>
      </WalProvider>
    </QueryClientProvider>
  );
}

export default App;
