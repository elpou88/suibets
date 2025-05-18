import React from 'react';
import { Switch, Route } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import LiveDataPage from './pages/LiveDataPage';
import UpcomingEventsPage from './pages/UpcomingEventsPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={LiveDataPage} />
          <Route path="/upcoming" component={UpcomingEventsPage} />
        </Switch>
      </main>
      <Toaster />
    </>
  );
}

export default App;