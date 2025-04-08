import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowRight, Info, Scan, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader } from "@/components/ui/loader";

export default function ConnectWallet() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('sui');
  const [wurlusRegistered, setWurlusRegistered] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState<boolean>(false);

  // Mock wallet connection function
  const connectWallet = async (walletType: 'sui' | 'wurlus') => {
    setConnecting(true);
    try {
      // Simulate API call to connect wallet
      const response = await apiRequest('POST', '/api/wallet/connect', {
        walletType,
        address: walletType === 'sui' ? 
          '0x' + Math.floor(Math.random() * 10000000000000000).toString(16) : 
          walletAddress
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect wallet');
      }
      
      const data = await response.json();
      
      // Check Wurlus registration status if connecting Sui wallet
      if (walletType === 'sui' && data.address) {
        checkWurlusRegistration(data.address);
      }
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected your ${walletType.toUpperCase()} wallet`,
        variant: "default",
      });
      
      // Simulate login if not already logged in
      if (!user) {
        login({ 
          id: 1, 
          username: 'user1',
          password: 'password123', // Mock data for the required field
          email: 'user1@example.com', // Mock data for the required field
          walletAddress: data.address,
          walletFingerprint: null,
          walletType: walletType,
          balance: 1000, // Mock initial balance
          suiBalance: 1000,
          sbetsBalance: 10000,
          wurlusProfileId: null,
          wurlusRegistered: false,
          wurlusProfileCreatedAt: null,
          createdAt: new Date(),
          lastLoginAt: new Date()
        });
      }
      
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };
  
  // Check if wallet is registered with Wurlus protocol
  const checkWurlusRegistration = async (address: string) => {
    try {
      const response = await apiRequest(
        'GET', 
        `/api/wurlus/registration/${address}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to check registration status');
      }
      
      const data = await response.json();
      setWurlusRegistered(data.registered);
      
    } catch (error) {
      console.error('Error checking registration:', error);
      setWurlusRegistered(false);
    }
  };
  
  // Register with Wurlus protocol
  const registerWithWurlus = async () => {
    if (!user?.walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Sui wallet first",
        variant: "destructive",
      });
      return;
    }
    
    setRegistering(true);
    try {
      const response = await apiRequest(
        'POST',
        '/api/wurlus/connect',
        { walletAddress: user.walletAddress }
      );
      
      if (!response.ok) {
        throw new Error('Failed to register with Wurlus Protocol');
      }
      
      const data = await response.json();
      
      // Transaction object would contain blob data in real implementation
      console.log('Transaction data:', data.transaction);
      
      toast({
        title: "Registration Complete",
        description: "Successfully registered with Wurlus Protocol",
        variant: "default",
      });
      
      setWurlusRegistered(true);
      
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not register. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Layout title="Connect Wallet" showBackButton={true}>
      <div className="max-w-md mx-auto mt-6">
        <Card className="bg-[#0b1618] border-[#1e3a3f] text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription className="text-gray-400">
              Connect your wallet to start betting with the Wurlus Protocol
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#112225]">
                <TabsTrigger 
                  value="sui" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                >
                  Sui Wallet
                </TabsTrigger>
                <TabsTrigger 
                  value="manual" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
                >
                  Manual Connect
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sui" className="mt-4">
                <div className="space-y-4">
                  <div className="rounded-md bg-[#112225] p-4">
                    <div className="flex items-center">
                      <div className="bg-cyan-900 p-3 rounded-full mr-3">
                        <Wallet className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">Sui Wallet</h3>
                        <p className="text-sm text-gray-400">Connect using your Sui browser extension</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-black font-bold"
                    disabled={connecting}
                    onClick={() => connectWallet('sui')}
                  >
                    {connecting ? (
                      <>
                        <Loader size="sm" className="text-black" />
                        <span className="ml-2">Connecting...</span>
                      </>
                    ) : (
                      <>
                        Connect Sui Wallet
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  {user?.walletAddress && (
                    <div className="mt-4 p-3 bg-[#112225] rounded-md">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                        <p className="text-sm text-gray-300">
                          Connected: {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="manual" className="mt-4">
                <div className="space-y-4">
                  <div className="rounded-md bg-[#112225] p-4">
                    <label className="block text-sm font-medium mb-1">Wallet Address</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0b1618] border border-[#1e3a3f] rounded-md p-2 text-white"
                      placeholder="Enter your Sui wallet address (0x...)"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-black font-bold"
                    disabled={connecting || !walletAddress}
                    onClick={() => connectWallet('wurlus')}
                  >
                    {connecting ? (
                      <>
                        <Loader size="sm" className="text-black" />
                        <span className="ml-2">Connecting...</span>
                      </>
                    ) : (
                      <>
                        Connect Manually
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Wurlus Protocol Registration */}
            {user?.walletAddress && wurlusRegistered === false && (
              <div className="mt-6 p-4 border border-yellow-600 bg-yellow-900 bg-opacity-20 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-400">Wurlus Protocol Registration Required</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Your wallet needs to be registered with Wurlus Protocol to enable blockchain betting features.
                    </p>
                    <Button 
                      className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-black"
                      onClick={registerWithWurlus}
                      disabled={registering}
                    >
                      {registering ? (
                        <>
                          <Loader size="sm" className="text-black" />
                          <span className="ml-2">Registering...</span>
                        </>
                      ) : (
                        <>
                          Register with Wurlus
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {user?.walletAddress && wurlusRegistered === true && (
              <div className="mt-6 p-4 border border-green-600 bg-green-900 bg-opacity-20 rounded-md">
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-400">Wurlus Protocol Registered</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Your wallet is registered with the Wurlus Protocol. You can now place bets using SUI and SBETS tokens.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col items-start border-t border-[#1e3a3f] pt-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 text-cyan-400 mr-2 mt-0.5" />
              <p className="text-xs text-gray-400">
                By connecting your wallet, you'll be able to place bets using both Sui tokens and SBETS tokens, participate in staking, and claim dividends from the Wurlus Protocol.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}