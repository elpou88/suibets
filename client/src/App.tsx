import React, { useState, useEffect } from 'react';
import { Switch, Route } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import LiveDataPage from './pages/LiveDataPage';
import UpcomingEventsPage from './pages/UpcomingEventsPage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Check wallet connection status on load
  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        const response = await fetch('/api/auth/wallet-status');
        const data = await response.json();
        
        if (data.authenticated) {
          setWalletConnected(true);
          setWalletAddress(data.wallet.address);
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
      }
    };
    
    checkWalletStatus();
  }, []);

  // Listen for wallet connect/disconnect events
  useEffect(() => {
    const handleWalletConnected = (event: CustomEvent) => {
      setWalletConnected(true);
      setWalletAddress(event.detail.address);
    };
    
    const handleWalletDisconnected = () => {
      setWalletConnected(false);
      setWalletAddress(null);
    };
    
    window.addEventListener('walletconnected', handleWalletConnected as EventListener);
    window.addEventListener('walletdisconnected', handleWalletDisconnected);
    
    return () => {
      window.removeEventListener('walletconnected', handleWalletConnected as EventListener);
      window.removeEventListener('walletdisconnected', handleWalletDisconnected);
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <Switch>
          <Route path="/">
            <LiveDataPage 
              walletConnected={walletConnected} 
              walletAddress={walletAddress || undefined} 
            />
          </Route>
          <Route path="/upcoming">
            <UpcomingEventsPage 
              walletConnected={walletConnected} 
              walletAddress={walletAddress || undefined} 
            />
          </Route>
          <Route path="/profile">
            <ProfilePage />
          </Route>
        </Switch>
      </main>
      <Toaster />
    </>
  );
}

export default App;