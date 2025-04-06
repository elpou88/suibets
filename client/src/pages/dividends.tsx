import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { WalDividends, WalStaking, useWal } from '@/components/ui/wal-components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Award, History } from 'lucide-react';
import { useLocation } from 'wouter';

const DividendsPage: React.FC = () => {
  const { user } = useWal();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('dividends');
  const [location, setLocation] = useLocation();

  const handleStakeSuccess = (txHash: string, amount: number, periodDays: number) => {
    toast({
      title: 'Staking Successful',
      description: `You have staked ${amount.toFixed(4)} SUI for ${periodDays} days.`,
      variant: 'default',
    });
  };

  const handleClaimSuccess = (amount: number) => {
    toast({
      title: 'Dividends Claimed',
      description: `You have successfully claimed ${amount.toFixed(4)} SUI in dividends.`,
      variant: 'default',
    });
  };

  const handleError = (error: Error) => {
    toast({
      title: 'Error',
      description: error.message || 'An error occurred',
      variant: 'destructive',
    });
  };

  const navigateToBetHistory = () => {
    setLocation('/bet-history');
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dividends & Staking</h1>
          {user && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={navigateToBetHistory}
            >
              <History className="h-4 w-4" />
              View Bet History
            </Button>
          )}
        </div>

        {user ? (
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dividends" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Dividends
              </TabsTrigger>
              <TabsTrigger value="staking" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Staking
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dividends" className="mt-4">
              <WalDividends 
                onClaimSuccess={handleClaimSuccess}
                onError={handleError}
              />
            </TabsContent>
            <TabsContent value="staking" className="mt-4">
              <WalStaking 
                onStakeSuccess={handleStakeSuccess}
                onError={handleError}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dividends & Staking</CardTitle>
              <CardDescription>
                Connect your wallet to view your dividends and stake your SUI tokens to earn rewards.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6 space-y-4">
              <p className="text-center text-muted-foreground">
                To access dividends and staking features, please connect your Sui wallet.
              </p>
              <Button 
                onClick={() => setLocation('/connect-wallet')}
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DividendsPage;