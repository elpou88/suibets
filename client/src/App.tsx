import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import Match from "@/pages/match";
import Promotions from "@/pages/promotions";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/context/AuthContext";
import { BettingProvider } from "@/context/BettingContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/match/:id" component={Match} />
      <Route path="/promotions" component={Promotions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BettingProvider>
          <Layout>
            <Router />
          </Layout>
          <Toaster />
        </BettingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
