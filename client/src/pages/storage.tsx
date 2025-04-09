import React from 'react';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/layout/MainLayout';
import { TuskyVaultManager } from '@/components/storage/TuskyVaultManager';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Save, History, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTuskyStorage, VaultType } from '@/services/TuskyService';
import { useWalletAdapter } from '@/components/wallet/WalletAdapter';
import { useToast } from '@/hooks/use-toast';

// Storage management page
export default function StoragePage() {
  const { address, isConnected } = useWalletAdapter();
  const { storeUserData, getUserData, storeBettingHistory } = useTuskyStorage();
  const { toast } = useToast();
  
  // Function to test storing data
  const handleStoreTestData = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Store some test data in user profile
      await storeUserData('preferences', {
        theme: 'dark',
        notifications: true,
        language: 'en',
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: 'Data Stored Successfully',
        description: 'Test data was saved to your user profile vault',
      });
    } catch (error) {
      console.error('Error storing test data:', error);
      toast({
        title: 'Storage Failed',
        description: 'Failed to store test data. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Function to test storing betting history
  const handleStoreBettingTest = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create a test bet record
      const testBetId = `bet-${Date.now()}`;
      await storeBettingHistory(testBetId, {
        id: testBetId,
        event: 'Manchester United vs Liverpool',
        selection: 'Manchester United',
        odds: 2.5,
        stake: 10,
        potentialPayout: 25,
        currency: 'SUI',
        status: 'pending',
        placedAt: new Date().toISOString(),
      });
      
      toast({
        title: 'Bet Recorded',
        description: 'Test bet was saved to your betting history vault',
      });
    } catch (error) {
      console.error('Error storing test bet:', error);
      toast({
        title: 'Storage Failed',
        description: 'Failed to store test bet data. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <MainLayout>
      <Helmet>
        <title>Decentralized Storage | SuiBets</title>
      </Helmet>
      
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-2 text-[#00FFFF]">Decentralized Storage</h1>
        <p className="text-gray-400 mb-6">
          Store your betting data securely on the Tusky decentralized storage network
        </p>
        
        <Tabs defaultValue="vaults" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="vaults" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Storage Vaults</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Manage Data</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="vaults" className="space-y-4">
            <TuskyVaultManager />
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#00FFFF]">Storage Data Management</CardTitle>
                <CardDescription>
                  Test storing and retrieving data from your Tusky vaults
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#112225]">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Save className="w-4 h-4 mr-2" /> User Preferences
                      </CardTitle>
                      <CardDescription>
                        Store and manage user settings and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleStoreTestData}
                        className="w-full bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
                      >
                        Store Test Preferences
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        This will store sample user preferences in your profile vault
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#112225]">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <History className="w-4 h-4 mr-2" /> Betting History
                      </CardTitle>
                      <CardDescription>
                        Store betting history and results securely
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleStoreBettingTest}
                        className="w-full bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
                      >
                        Store Test Bet
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        This will create a sample bet record in your betting history vault
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6 p-4 bg-[#112225] rounded-md">
                  <h3 className="text-[#00FFFF] font-medium mb-2">How Tusky Storage Works</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Tusky provides decentralized storage solutions on the Sui blockchain, allowing you to:
                  </p>
                  <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5">
                    <li>Store betting history with cryptographic proof</li>
                    <li>Keep your preferences and settings synchronized across devices</li>
                    <li>Maintain full ownership of your data</li>
                    <li>Access your data directly from the blockchain</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Powered by <a href="https://app.tusky.io" target="_blank" rel="noopener noreferrer" className="text-[#00FFFF]">Tusky.io</a> - 
            Decentralized Storage Protocol
          </p>
        </div>
      </div>
    </MainLayout>
  );
}