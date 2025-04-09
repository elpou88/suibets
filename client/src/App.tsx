import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Legacy image-based pages
import Home from "@/pages/home";
import Match from "@/pages/match";
import Sport from "@/pages/sport";
import MatchDetail from "@/pages/match-detail";
import Promotions from "@/pages/promotions";
import ReferralPage from "@/pages/promotions/referral";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import BetSlip from "@/pages/bet-slip";
import BetSlip2 from "@/pages/bet-slip-2";
import ConnectWallet from "@/pages/connect-wallet";
import NotFound from "@/pages/not-found";
import RedirectToPromotions from "@/pages/redirect-to-promotions";
import RedirectToLive from "@/pages/redirect-to-live";
import Info from "@/pages/info";
import Community from "@/pages/community";
import Contact from "@/pages/contact";
import LiveEventPage from "@/pages/live/[id]";
import Live from "@/pages/live";
import LiveExact from "@/pages/live-exact";
import SportsExact from "@/pages/sports-exact";
import GotoSports from "@/pages/goto-sports";

// Context providers and shared components
import { AuthProvider } from "@/context/AuthContext";
import { BettingProvider } from "@/context/BettingContext";
import { WalProvider } from "@/components/ui/wal-components";
import { SpecialLinks } from "@/components/ui/SpecialLinks";
import { DepositWithdrawFAB } from "@/components/modals/DepositWithdrawFAB";
import { UniversalClickHandler } from "@/components/betting/UniversalClickHandler";
import { SportBettingWrapper } from "@/components/betting/SportBettingWrapper";
import { SuietWalletProvider } from "@/components/wallet/SuietWalletProvider";

// New real-time data pages
import HomeReal from "@/pages/home-real";
import LiveReal from "@/pages/live-real";
import SportsLive from "@/pages/sports-live";
import PromotionsReal from "@/pages/promotions-real";
import BetHistoryReal from "@/pages/bet-history-real";
import BetHistoryPage from "@/pages/bet-history"; // Our new bet history page
import DividendsReal from "@/pages/dividends-real";
import Parlay from "@/pages/parlay";
import SportPage from "@/pages/sports-live/[sport]";
import DefiStaking from "@/pages/defi-staking";
import StoragePage from "@/pages/storage";

function App() {
  console.log("Starting React application");
  
  return (
    <QueryClientProvider client={queryClient}>
      <SuietWalletProvider>
        <WalProvider>
          <AuthProvider>
            <BettingProvider>
              <div className="root-container">
                <Switch>
                  {/* Main Routes - Use real data pages as the default */}
                  <Route path="/" component={HomeReal} />
                  <Route path="/sports" component={HomeReal} />
                  <Route path="/sport/:slug*" component={SportsLive} />
                  <Route path="/match/:id" component={Match} />
                  <Route path="/match-detail/:id" component={MatchDetail} />
                  <Route path="/live" component={LiveReal} />
                  <Route path="/live/:id" component={LiveEventPage} />
                  
                  {/* Additional Pages - Using real-time data pages */}
                  <Route path="/promotions" component={PromotionsReal} />
                  <Route path="/promotions/referral" component={ReferralPage} />
                  <Route path="/notifications" component={Notifications} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/bet-history" component={BetHistoryPage} />
                  <Route path="/dividends" component={DividendsReal} />
                  <Route path="/defi-staking" component={DefiStaking} />
                  <Route path="/storage" component={StoragePage} />
                  <Route path="/connect-wallet" component={ConnectWallet} />
                  <Route path="/join" component={HomeReal} />
                  
                  {/* Info Pages */}
                  <Route path="/info" component={Info} />
                  <Route path="/community" component={Community} />
                  <Route path="/contact" component={Contact} />
                  
                  {/* Legacy Routes - Redirects */}
                  <Route path="/goto-sports" component={HomeReal} />
                  <Route path="/goto-promotions" component={RedirectToPromotions} />
                  <Route path="/goto-live" component={LiveReal} />
                  <Route path="/sports-exact" component={HomeReal} />
                  <Route path="/live-exact" component={LiveReal} />
                  <Route path="/bet-slip" component={BetSlip} />
                  <Route path="/bet-slip-2" component={BetSlip2} />
                  
                  {/* Legacy Routes with new names for backward compatibility */}
                  <Route path="/home-real" component={HomeReal} />
                  <Route path="/live-real" component={LiveReal} />
                  <Route path="/sports-live" component={SportsLive} />
                  <Route path="/sports-live/:sport" component={SportPage} />
                  <Route path="/parlay" component={Parlay} />
                  
                  <Route component={NotFound} />
                </Switch>
                
                {/* Floating deposit/withdraw buttons that appear on all pages */}
                <DepositWithdrawFAB />
                
                {/* Universal betting handlers to enable betting across all pages */}
                <UniversalClickHandler />
                <SportBettingWrapper />
              </div>
              <SpecialLinks />
              <Toaster />
            </BettingProvider>
          </AuthProvider>
        </WalProvider>
      </SuietWalletProvider>
    </QueryClientProvider>
  );
}

export default App;