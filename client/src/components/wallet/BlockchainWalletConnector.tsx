import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBlockchainAuth } from '@/hooks/useBlockchainAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, CheckCircle, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ConnectButton, useWallet } from '@suiet/wallet-kit';

interface BlockchainWalletConnectorProps {
  onConnect?: (address: string) => void;
}

export function BlockchainWalletConnector({ onConnect }: BlockchainWalletConnectorProps) {
  const { toast } = useToast();
  const { user, isLoading, connectWalletMutation, disconnectWalletMutation } = useBlockchainAuth();
  const [showWallets, setShowWallets] = useState(false);
  
  // Get Suiet wallet state
  const suietWallet = useWallet();
  
  // Effect to handle successful connection
  useEffect(() => {
    if (user?.walletAddress && user?.authenticated && onConnect) {
      onConnect(user.walletAddress);
    }
  }, [user, onConnect]);
  
  const handleConnectWallet = async (walletAddress: string, walletType: string = 'Sui') => {
    try {
      await connectWalletMutation.mutateAsync({
        walletAddress,
        walletType
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setShowWallets(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      await disconnectWalletMutation.mutateAsync();
      
      // Disconnect Suiet wallet if connected
      if (suietWallet.connected) {
        await suietWallet.disconnect();
        console.log('Suiet wallet disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };
  
  const handleWalletButtonClick = () => {
    setShowWallets(!showWallets);
  };
  
  // Display connected wallet info
  if (user?.authenticated) {
    return (
      <Card className="w-full max-w-md mx-auto bg-[#112225] border-[#1e3a3f] text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-[#00ffff]" />
            Connected Wallet
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your wallet is connected to the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Address</p>
              <p className="text-xs font-mono text-[#00ffff]">
                {user.walletAddress.substring(0, 8)}...
                {user.walletAddress.substring(user.walletAddress.length - 6)}
              </p>
            </div>
            <Badge className="bg-[#1e3a3f] text-[#00ffff]">
              <ShieldCheck className="h-3 w-3 mr-1" /> Blockchain Verified
            </Badge>
          </div>
          
          {user.suiBalance !== undefined && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-200 mb-1">Balance</p>
              <div className="flex items-center justify-between">
                <span className="text-[#00ffff] font-medium">{user.suiBalance.toFixed(2)} SUI</span>
                {user.sbetsBalance !== undefined && (
                  <span className="text-[#00ffff] font-medium">{user.sbetsBalance.toFixed(2)} SBETS</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full border-[#1e3a3f] text-[#00ffff] hover:bg-[#1e3a3f]"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto bg-[#112225] border-[#1e3a3f] text-white">
      <CardHeader>
        <CardTitle className="text-white">Connect Your Wallet</CardTitle>
        <CardDescription className="text-gray-400">
          Connect your Sui wallet to start betting with the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || connectWalletMutation.isPending ? (
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#00ffff] mb-4" />
            <p className="text-sm text-gray-300 mb-2">
              Connecting to blockchain...
            </p>
            <Progress 
              value={75} 
              className="h-1 w-full bg-[#1e3a3f]" 
            />
          </div>
        ) : showWallets ? (
          <div className="space-y-3">
            {/* Suiet Wallet Connect Button */}
            <div className="w-full rounded overflow-hidden mb-4">
              <ConnectButton 
                className="w-full bg-gradient-to-r from-[#00FFFF] to-[#00CCCC] hover:from-[#00FFFF]/90 hover:to-[#00CCCC]/90 text-[#112225] font-bold py-3 px-4 rounded flex items-center justify-center"
              >
                <Wallet className="h-5 w-5 mr-2" />
                <span>Connect with Suiet Wallet</span>
              </ConnectButton>
            </div>
            
            {/* Additional Sui Wallet Options */}
            <div className="w-full rounded overflow-hidden mb-4">
              <Button
                onClick={() => {
                  // In a production app, we would integrate with Sui Wallet here
                  // For demo purposes, we'll just use the handleConnectWallet function
                  handleConnectWallet('0x' + Math.random().toString(16).substring(2, 42), 'SuiWallet');
                }}
                className="w-full bg-[#1e3a3f] text-[#00ffff] hover:bg-[#254249] py-3 px-4 rounded flex items-center justify-center"
              >
                <Wallet className="h-5 w-5 mr-2" />
                <span>Connect with Sui Wallet</span>
              </Button>
            </div>
            
            {/* Manual connect for any wallet address */}
            <div className="rounded-lg border border-[#1e3a3f] p-4 bg-[#0b1618] mt-4">
              <h3 className="font-medium text-[#00ffff] mb-2 flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect any Sui wallet
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                For wallet extensions or mobile wallets, you can enter your Sui address directly.
              </p>
              <Button
                onClick={() => {
                  // For demo purposes, we'll just use a sample address
                  // In production, this would be a form input
                  handleConnectWallet('0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285');
                }}
                className="w-full bg-[#1e3a3f] text-[#00ffff] hover:bg-[#254249]"
              >
                <ShieldCheck className="mr-2 h-4 w-4" /> Connect Any Wallet
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="rounded-lg border border-[#1e3a3f] p-4 bg-[#0b1618]">
              <h3 className="font-medium text-[#00ffff] mb-2">Why Connect Your Wallet?</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-[#00ffff] mt-0.5 flex-shrink-0" />
                  <span>Place crypto bets securely with SUI or SBETS tokens</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-[#00ffff] mt-0.5 flex-shrink-0" />
                  <span>All authentication happens on the blockchain</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-[#00ffff] mt-0.5 flex-shrink-0" />
                  <span>Earn dividends from the protocol</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!showWallets && !isLoading && !connectWalletMutation.isPending && (
          <Button 
            className="w-full bg-[#00ffff] text-[#112225] hover:bg-cyan-300"
            onClick={handleWalletButtonClick}
          >
            <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
          </Button>
        )}
        {showWallets && !isLoading && !connectWalletMutation.isPending && (
          <Button 
            variant="outline" 
            className="w-full border-[#1e3a3f] text-gray-300 hover:bg-[#1e3a3f]"
            onClick={() => setShowWallets(false)}
          >
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}