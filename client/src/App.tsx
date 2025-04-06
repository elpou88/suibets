import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import Match from "@/pages/match";
import Promotions from "@/pages/promotions";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import BetHistory from "@/pages/bet-history";
import BetSlip from "@/pages/bet-slip";
import BetSlip2 from "@/pages/bet-slip-2";
import ConnectWallet from "@/pages/connect-wallet";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/context/AuthContext";
import { BettingProvider } from "@/context/BettingContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sports" component={Home} />
      <Route path="/live" component={Home} />
      <Route path="/match/:id" component={Match} />
      <Route path="/promotions" component={Promotions} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      <Route path="/bet-history" component={BetHistory} />
      <Route path="/bet-slip" component={BetSlip} />
      <Route path="/bet-slip-2" component={BetSlip2} />
      <Route path="/connect-wallet" component={ConnectWallet} />
      <Route path="/join" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BettingProvider>
          <Router />
          <Toaster />
        </BettingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
