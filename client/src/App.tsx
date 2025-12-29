import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import React, { useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Main pages - unified SuiBets design
import CleanHome from "@/pages/clean-home";
import Match from "@/pages/match";
import MatchDetail from "@/pages/match-detail";
import Promotions from "@/pages/promotions";
import ReferralPage from "@/pages/promotions/referral";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import WalletDashboard from "@/pages/wallet-dashboard";
import NotFound from "@/pages/not-found";
import Info from "@/pages/info";
import Community from "@/pages/community";
import Contact from "@/pages/contact";
import LiveEventPage from "@/pages/live/[id]";

// Context providers and shared components
import { AuthProvider } from "@/context/AuthContext";
import { BlockchainAuthProvider } from "@/hooks/useBlockchainAuth";
import { BettingProvider } from "@/context/BettingContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { WalProvider } from "@/components/ui/wal-components";
import { WalrusProtocolProvider } from "@/context/WalrusProtocolContext";
import { SpecialLinks } from "@/components/ui/SpecialLinks";
import { UniversalClickHandler } from "@/components/betting/UniversalClickHandler";
import { SportBettingWrapper } from "@/components/betting/SportBettingWrapper";
import { SuietWalletProvider } from "@/components/wallet/SuietWalletProvider";
import { SuiDappKitProvider } from "@/components/wallet/SuiDappKitProvider";
import { WalletKitProvider } from "@mysten/wallet-kit";
import { BetSlip } from "@/components/betting/BetSlip";

// Core functionality pages
import SportsLive from "@/pages/sports-live";
import BetHistoryPage from "@/pages/bet-history";
import DividendsReal from "@/pages/dividends-real";
import SportPage from "@/pages/sports-live/[sport]";
import StoragePage from "@/pages/storage";
import LiveScoresPage from "@/pages/live-scores";
import ParlayPageNew from "@/pages/parlay";
import Layout from "@/components/layout/Layout";
import JoinPage from "@/pages/join";
import LiveEventsPage from "@/pages/live-events";
import UpcomingEventsPage from "@/pages/upcoming-events";
import ResultsPage from "@/pages/results";
import ActivityPage from "@/pages/activity";
import DepositsWithdrawalsPage from "@/pages/deposits-withdrawals";
import AuditLogPage from "@/pages/audit-log";
import WhitepaperPage from "@/pages/whitepaper";
import AdminPanel from "@/pages/admin-panel";

// Informational Pages
import PrivacyPolicy from "@/pages/privacy";
import FAQPage from "@/pages/faq";
import ResponsibleGambling from "@/pages/responsible";
import RulesPage from "@/pages/rules";
import IntegrityPage from "@/pages/integrity";
import AffiliatePage from "@/pages/affiliate";
import BlogPage from "@/pages/blog";

function App() {
  console.log("Starting React application");
  
  // Log wallet detection on app start
  useEffect(() => {
    console.log("Checking for installed wallets...");
    
    // Check for wallet-standard support
    // @ts-ignore - Checking global object
    const hasWalletStandard = typeof window.walletStandard !== 'undefined';
    // @ts-ignore - Checking global object
    const hasSuiWallet = typeof window.suiWallet !== 'undefined';
    // @ts-ignore - Checking global object
    const hasEthosWallet = typeof window.ethos !== 'undefined';
    // @ts-ignore - Checking global object
    const hasSuietWallet = typeof window.suiet !== 'undefined';
    // @ts-ignore - Checking global object
    const hasMartianWallet = typeof window.martian !== 'undefined';
    
    console.log("Wallet detection:", {
      walletStandard: hasWalletStandard,
      suiWallet: hasSuiWallet,
      ethosWallet: hasEthosWallet,
      suietWallet: hasSuietWallet,
      martianWallet: hasMartianWallet
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {/* Order matters - WalletKitProvider enables useWalletKit hook */}
        <WalletKitProvider>
          {/* SuiDappKitProvider for Sui dapp integration */}
          <SuiDappKitProvider>
            {/* SuietWalletProvider as a fallback for Suiet wallet compatibility */}
            <SuietWalletProvider>
              {/* Other application providers */}
              <WalProvider>
              <WalrusProtocolProvider>
                <BlockchainAuthProvider>
                  <AuthProvider>
                    <SettingsProvider>
                      <BettingProvider>
                        <div className="root-container">
                          <UniversalClickHandler />
                          <Switch>
                          {/* Main Routes - Unified SuiBets design */}
                          <Route path="/" component={CleanHome} />
                          <Route path="/sports" component={CleanHome} />
                          <Route path="/sport/:slug*" component={SportsLive} />
                          <Route path="/match/:id" component={Match} />
                          <Route path="/match-detail/:id" component={MatchDetail} />
                          <Route path="/live" component={LiveEventsPage} />
                          <Route path="/live/:id" component={LiveEventPage} />
                          <Route path="/live-events" component={LiveEventsPage} />
                          <Route path="/upcoming-events" component={UpcomingEventsPage} />
                          
                          {/* Core Pages */}
                          <Route path="/promotions" component={Promotions} />
                          <Route path="/results" component={ResultsPage} />
                          <Route path="/promotions/referral" component={ReferralPage} />
                          <Route path="/notifications" component={Notifications} />
                          <Route path="/settings" component={Settings} />
                          <Route path="/bet-history" component={BetHistoryPage} />
                          <Route path="/dividends" component={DividendsReal} />
                          <Route path="/storage" component={StoragePage} />
                          <Route path="/live-scores" component={LiveScoresPage} />
                          
                          {/* Wallet & User Pages */}
                          <Route path="/wallet-dashboard" component={WalletDashboard} />
                          <Route path="/dashboard" component={WalletDashboard} />
                          <Route path="/activity" component={ActivityPage} />
                          <Route path="/deposits-withdrawals" component={DepositsWithdrawalsPage} />
                          <Route path="/audit-log" component={AuditLogPage} />
                          <Route path="/whitepaper" component={WhitepaperPage} />
                          <Route path="/join" component={JoinPage} />
                          
                          {/* Info Pages */}
                          <Route path="/info" component={Info} />
                          <Route path="/community" component={Community} />
                          <Route path="/contact" component={Contact} />
                          <Route path="/privacy" component={PrivacyPolicy} />
                          <Route path="/faq" component={FAQPage} />
                          <Route path="/responsible" component={ResponsibleGambling} />
                          <Route path="/rules" component={RulesPage} />
                          <Route path="/integrity" component={IntegrityPage} />
                          <Route path="/affiliate" component={AffiliatePage} />
                          <Route path="/blog" component={BlogPage} />
                          
                          {/* Sports Pages */}
                          <Route path="/sports-live" component={SportsLive} />
                          <Route path="/sports-live/:sport" component={SportPage} />
                          <Route path="/parlay" component={ParlayPageNew} />
                          
                          {/* Legacy redirects to main pages */}
                          <Route path="/goto-sports" component={CleanHome} />
                          <Route path="/goto-live" component={LiveEventsPage} />
                          <Route path="/home-real" component={CleanHome} />
                          <Route path="/live-real" component={LiveEventsPage} />
                          
                          {/* Admin Panel - Password Protected */}
                          <Route path="/admin" component={AdminPanel} />
                          
                          <Route component={NotFound} />
                        </Switch>
                        
                        {/* Universal betting handlers to enable betting across all pages */}
                        <SportBettingWrapper />
                        
                        {/* Floating BetSlip - always visible when bets are selected */}
                        <div className="fixed bottom-4 right-4 w-80 z-50 max-h-[70vh] overflow-auto" data-testid="floating-betslip">
                          <BetSlip />
                        </div>
                      </div>
                      <SpecialLinks />
                      <Toaster />
                    </BettingProvider>
                    </SettingsProvider>
                  </AuthProvider>
                </BlockchainAuthProvider>
              </WalrusProtocolProvider>
            </WalProvider>
            </SuietWalletProvider>
          </SuiDappKitProvider>
        </WalletKitProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;