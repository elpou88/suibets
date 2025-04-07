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
import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/context/AuthContext";
import { BettingProvider } from "@/context/BettingContext";
import { WalProvider } from "@/components/ui/wal-components";
import { SpecialLinks } from "@/components/ui/SpecialLinks";
import Info from "@/pages/info";
import Community from "@/pages/community";
import Contact from "@/pages/contact";
import LiveEventPage from "@/pages/live/[id]";
import Live from "@/pages/live";

// Wrap each page component with Layout
const HomePage = () => (
  <Layout>
    <Home />
  </Layout>
);

const SportPage = ({ params }: { params: any }) => (
  <Layout>
    <Sport {...params} />
  </Layout>
);

const MatchPage = ({ params }: { params: any }) => (
  <Layout>
    <Match {...params} />
  </Layout>
);

const LivePage = () => (
  <Layout>
    <Live />
  </Layout>
);

const LiveEventDetailPage = ({ params }: { params: any }) => (
  <Layout>
    <LiveEventPage {...params} />
  </Layout>
);

const PromotionsPage = () => (
  <Layout>
    <Promotions />
  </Layout>
);

const NotificationsPage = () => (
  <Layout>
    <Notifications />
  </Layout>
);

const SettingsPage = () => (
  <Layout>
    <Settings />
  </Layout>
);

const BetHistoryPage = () => (
  <Layout>
    <BetHistory />
  </Layout>
);

const BetSlipPage = () => (
  <Layout>
    <BetSlip />
  </Layout>
);

const ConnectWalletPage = () => (
  <Layout>
    <ConnectWallet />
  </Layout>
);

const InfoPage = () => (
  <Layout>
    <Info />
  </Layout>
);

const CommunityPage = () => (
  <Layout>
    <Community />
  </Layout>
);

const ContactPage = () => (
  <Layout>
    <Contact />
  </Layout>
);

function Router() {
  console.log("Router initialized");
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/sports" component={HomePage} />
      <Route path="/sport/:slug*" component={SportPage} />
      <Route path="/match/:id" component={MatchPage} />
      <Route path="/match-detail/:id" component={MatchDetail} />
      <Route path="/promotions" component={PromotionsPage} />
      <Route path="/promotions/referral" component={ReferralPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/bet-history" component={BetHistoryPage} />
      <Route path="/bet-slip" component={BetSlipPage} />
      <Route path="/bet-slip-2" component={BetSlip2} />
      <Route path="/connect-wallet" component={ConnectWalletPage} />
      <Route path="/join" component={HomePage} />
      <Route path="/goto-promotions" component={RedirectToPromotions} />
      <Route path="/goto-live" component={RedirectToLive} />
      <Route path="/info" component={InfoPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/live" component={LivePage} />
      <Route path="/live/:id" component={LiveEventDetailPage} />
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
            <SpecialLinks />
            <Toaster />
          </BettingProvider>
        </AuthProvider>
      </WalProvider>
    </QueryClientProvider>
  );
}

export default App;
