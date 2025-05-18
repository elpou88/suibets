import { Route, Switch } from 'wouter';
import { Suspense, lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from './components/ui/toaster';
import { WalletKitProvider } from '@mysten/wallet-kit';
import Layout from './components/layout/Layout';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Sports = lazy(() => import('./pages/Sports'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const LiveEvents = lazy(() => import('./pages/LiveEvents'));
const BetSlip = lazy(() => import('./pages/BetSlip'));
const BetHistory = lazy(() => import('./pages/BetHistory'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Promotions = lazy(() => import('./pages/Promotions'));
const Settings = lazy(() => import('./pages/Settings'));
const Staking = lazy(() => import('./pages/Staking'));
const Dividends = lazy(() => import('./pages/Dividends'));
const ApiDashboard = lazy(() => import('./pages/ApiDashboard'));

export default function App() {
  return (
    <WalletKitProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/sports/:sportId?" component={Sports} />
              <Route path="/events/:eventId" component={EventDetails} />
              <Route path="/live" component={LiveEvents} />
              <Route path="/bet-slip" component={BetSlip} />
              <Route path="/bet-history" component={BetHistory} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/promotions" component={Promotions} />
              <Route path="/settings" component={Settings} />
              <Route path="/staking" component={Staking} />
              <Route path="/dividends" component={Dividends} />
              <Route path="/api-dashboard" component={ApiDashboard} />
            </Switch>
          </Layout>
        </Suspense>
        <Toaster />
      </QueryClientProvider>
    </WalletKitProvider>
  );
}