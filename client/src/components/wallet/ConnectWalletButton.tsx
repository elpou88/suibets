import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, LogOut } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { useWalletAdapter } from './WalletAdapter';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';

const ConnectWalletButton: React.FC = () => {
  const { 
    connect, 
    disconnect, 
    address, 
    isConnected, 
    isLoading, 
    balances,
    error 
  } = useWalletAdapter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Close dialog when connected
  useEffect(() => {
    if (isConnected) {
      setIsDialogOpen(false);
    }
  }, [isConnected]);

  // Connected state with dropdown for wallet options
  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full space-x-2">
            <Wallet className="h-4 w-4" />
            <span>{shortenAddress(address)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Your Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex justify-between">
            <span>SUI</span>
            <span>{formatCurrency(balances.SUI)}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex justify-between">
            <span>SBETS</span>
            <span>{formatCurrency(balances.SBETS)}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect} className="text-red-500 cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Button disabled variant="outline" className="w-full">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    );
  }

  // Connect wallet dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Your Sui Wallet</DialogTitle>
          <DialogDescription>
            Connect your Sui wallet to place bets, deposit, and withdraw funds.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="text-red-500 text-sm mb-4 p-2 border border-red-300 rounded bg-red-50">
            {error}
          </div>
        )}
        
        <div className="grid gap-4 py-4">
          <Button onClick={connect} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectWalletButton;