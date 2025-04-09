import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight, Info, Scan, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader } from "@/components/ui/loader";
import { useWalletAdapter } from "@/components/wallet/WalletAdapter";

export default function ConnectWallet() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { connect: connectAdapter, address, isConnected, balances } = useWalletAdapter();
  const [connecting, setConnecting] = useState<boolean>(false);
  const [wurlusRegistered, setWurlusRegistered] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState<boolean>(false);
  
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
  
  // Connect using the wallet adapter
  const connectWallet = async () => {
    console.log("Connect wallet button clicked");
    setConnecting(true);
    try {
      console.log("Attempting to connect via adapter...");
      await connectAdapter();
      console.log("Connect adapter call completed, current address:", address);
      
      if (address) {
        console.log("Address available, checking Wurlus registration");
        // Check Wurlus registration status for this wallet
        checkWurlusRegistration(address);
      } else {
        console.log("No address after connection attempt - user may need to install wallet extension");
        toast({
          title: "No Wallet Detected",
          description: "Please install a Sui wallet extension to connect to the platform.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Layout title="Connect Wallet" showBackButton={true}>
      <div className="max-w-md mx-auto mt-6">
        <Card className="bg-[#0b1618] border-[#1e3a3f] text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription className="text-gray-400">
              Connect your Sui wallet to start betting with the Wurlus Protocol
            </CardDescription>
          </CardHeader>
          
          <CardContent>
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
                onClick={connectWallet}
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
              
              {/* Show real wallet connection status */}
              {(address || user?.walletAddress) && (
                <div className="mt-4 p-3 bg-[#112225] rounded-md">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                    <p className="text-sm text-gray-300">
                      Connected: {(address || user?.walletAddress || '').slice(0, 6)}...
                      {(address || user?.walletAddress || '').slice(-4)}
                    </p>
                  </div>
                  
                  {/* Show balances from wallet adapter */}
                  <div className="mt-2 pt-2 border-t border-[#1e3a3f] text-sm text-gray-300">
                    <div className="flex justify-between items-center">
                      <span>SUI Balance:</span>
                      <span className="font-medium text-cyan-400">
                        {balances?.SUI ? Number(balances.SUI).toFixed(4) : '0.0000'} SUI
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>SBETS Balance:</span>
                      <span className="font-medium text-cyan-400">
                        {balances?.SBETS ? Number(balances.SBETS).toFixed(2) : '0.00'} SBETS
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Extension installation info */}
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-md">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Wallet Extension Required</h4>
                <p className="text-xs text-gray-300">
                  To connect your wallet, you need to have one of these Sui wallet browser extensions installed:
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  <a 
                    href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    • Sui Wallet
                  </a>
                  <a 
                    href="https://chrome.google.com/webstore/detail/ethos-sui-wallet/mcbigmjiafegjnnogedioegffbooigli" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    • Ethos Wallet
                  </a>
                  <a 
                    href="https://chrome.google.com/webstore/detail/suiet-sui-wallet/khpkpbbcccdmmclmpigdgddabeilkdpd" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    • Suiet Wallet
                  </a>
                  <a 
                    href="https://chrome.google.com/webstore/detail/martian-wallet-aptos-sui/efbglgofoippbgcjepnhiblaibcnclgk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    • Martian Wallet
                  </a>
                </div>
              </div>
            </div>
            
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