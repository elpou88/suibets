import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BetSlip from '@/components/BetSlip';
import WalletConnect from '@/components/WalletConnect';

interface BetSlipPageProps {
  walletConnected?: boolean;
  walletAddress?: string;
}

const BetSlipPage: React.FC<BetSlipPageProps> = ({ 
  walletConnected: propWalletConnected, 
  walletAddress: propWalletAddress 
}) => {
  const [walletConnected, setWalletConnected] = useState(propWalletConnected || false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(propWalletAddress);

  const handleWalletConnected = (address: string) => {
    setWalletConnected(true);
    setWalletAddress(address);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Your Bet Slip</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <BetSlip walletConnected={walletConnected} walletAddress={walletAddress} />
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Wallet Connection</CardTitle>
              <CardDescription>
                Connect your wallet to place bets with SUI tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletConnect onConnected={handleWalletConnected} />
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Betting Guide</CardTitle>
              <CardDescription>
                How to place bets on SuiBets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Connect your Sui blockchain wallet</li>
                <li>Select the sport events you want to bet on</li>
                <li>Enter your stake amount in SUI tokens</li>
                <li>Review the potential winnings</li>
                <li>Click "Place Bets" to confirm</li>
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">
                All bets are processed through secure smart contracts on the Sui blockchain. 
                Once confirmed, your bet is immutable and the odds are locked at the time of placement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BetSlipPage;