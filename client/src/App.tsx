import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import Match from "@/pages/match";
import Sport from "@/pages/sport";
import MatchDetail from "@/pages/match-detail";
import Promotions from "@/pages/promotions";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import BetHistory from "@/pages/bet-history";
import BetSlip from "@/pages/bet-slip";
import BetSlip2 from "@/pages/bet-slip-2";
import ConnectWallet from "@/pages/connect-wallet";
import NotFound from "@/pages/not-found";
import RedirectToPromotions from "@/pages/redirect-to-promotions";
import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/context/AuthContext";
import { BettingProvider } from "@/context/BettingContext";
import { WalProvider } from "@/components/ui/wal-components";

function Router() {
  console.log("Router initialized");
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sports" component={Home} />
      <Route path="/sport/:slug*" component={Sport} />
      <Route path="/live" component={Home} />
      <Route path="/match/:id" component={Match} />
      <Route path="/match-detail/:id" component={MatchDetail} />
      <Route path="/promotions" component={Promotions} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      <Route path="/bet-history" component={BetHistory} />
      <Route path="/bet-slip" component={BetSlip} />
      <Route path="/bet-slip-2" component={BetSlip2} />
      <Route path="/connect-wallet" component={ConnectWallet} />
      <Route path="/join" component={Home} />
      <Route path="/goto-promotions" component={RedirectToPromotions} />
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
            <Router />
            <Toaster />
          </BettingProvider>
        </AuthProvider>
      </WalProvider>
    </QueryClientProvider>
  );
}

export default App;
