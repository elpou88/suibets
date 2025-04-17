import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWalrusProtocol } from '@/hooks/useWalrusProtocol';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Mock Sui wallet integration - in production, this would use actual Sui wallet SDK
const mockWallets = [
  { name: 'Sui Wallet', address: '0x123...789', icon: '💼' },
  { name: 'Ethos Wallet', address: '0xabc...def', icon: '🔐' },
  { name: 'Suiet Wallet', address: '0x456...abc', icon: '📱' },
];

interface WalletConnectorProps {
  onConnect?: (address: string) => void;
}

export function WalletConnector({ onConnect }: WalletConnectorProps) {
  const { toast } = useToast();
  const { connectWalletMutation, useWalletRegistration, currentWallet, setCurrentWallet } = useWalrusProtocol();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);

  // Check registration status if wallet is selected
  const { data: registrationData, isLoading: isCheckingRegistration } = 
    useWalletRegistration(selectedWallet || undefined);

  // Effect to handle successful connection
  useEffect(() => {
    if (selectedWallet && registrationData?.isRegistered) {
      setCurrentWallet({
        address: selectedWallet,
        isRegistered: true
      });
      
      if (onConnect) {
        onConnect(selectedWallet);
      }
    }
  }, [selectedWallet, registrationData, setCurrentWallet, onConnect]);

  const handleConnectWallet = async (walletAddress: string) => {
    setSelectedWallet(walletAddress);
    setConnecting(true);
    
    try {
      // First check if the wallet is already registered
      if (registrationData?.isRegistered) {
        toast({
          title: 'Wallet Already Connected',
          description: 'This wallet is already connected to the Walrus protocol.',
          variant: 'default',
        });
        
        setCurrentWallet({
          address: walletAddress,
          isRegistered: true
        });
        
        if (onConnect) {
          onConnect(walletAddress);
        }
      } else {
        // If not registered, register it
        await connectWalletMutation.mutateAsync(walletAddress);
      }
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
      setShowWallets(false);
    }
  };

  const handleWalletButtonClick = () => {
    setShowWallets(!showWallets);
  };

  const handleDisconnect = () => {
    setSelectedWallet(null);
    setCurrentWallet(null);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
      variant: 'default',
    });
  };

  // Display connected wallet info
  if (currentWallet?.address) {
    return (
      <Card className="w-full max-w-md mx-auto bg-[#112225] border-[#1e3a3f] text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-[#00ffff]" />
            Connected Wallet
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your wallet is connected to the Walrus protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Address</p>
              <p className="text-xs font-mono text-[#00ffff]">
                {currentWallet.address.substring(0, 8)}...
                {currentWallet.address.substring(currentWallet.address.length - 6)}
              </p>
            </div>
            <Badge className="bg-[#1e3a3f] text-[#00ffff]">
              <CheckCircle className="h-3 w-3 mr-1" /> Registered
            </Badge>
          </div>
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
          Connect your Sui wallet to start betting with the Walrus protocol
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connecting || connectWalletMutation.isPending || isCheckingRegistration ? (
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#00ffff] mb-4" />
            <p className="text-sm text-gray-300 mb-2">
              {isCheckingRegistration 
                ? 'Checking wallet registration status...' 
                : 'Connecting to Walrus protocol...'}
            </p>
            <Progress 
              value={isCheckingRegistration ? 50 : 75} 
              className="h-1 w-full bg-[#1e3a3f]" 
            />
          </div>
        ) : showWallets ? (
          <div className="space-y-3">
            {mockWallets.map((wallet) => (
              <Button
                key={wallet.address}
                variant="outline"
                className="w-full flex justify-between items-center border-[#1e3a3f] text-white hover:bg-[#1e3a3f]"
                onClick={() => handleConnectWallet(wallet.address)}
              >
                <span>{wallet.icon} {wallet.name}</span>
                <span className="text-xs font-mono text-gray-400">{wallet.address}</span>
              </Button>
            ))}
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
                  <span>Receive automatic payouts when you win</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 text-[#00ffff] mt-0.5 flex-shrink-0" />
                  <span>Earn dividends from the Walrus protocol</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!showWallets && !connecting && !connectWalletMutation.isPending && !isCheckingRegistration && (
          <Button 
            className="w-full bg-[#00ffff] text-[#112225] hover:bg-cyan-300"
            onClick={handleWalletButtonClick}
          >
            <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
          </Button>
        )}
        {showWallets && !connecting && !connectWalletMutation.isPending && !isCheckingRegistration && (
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