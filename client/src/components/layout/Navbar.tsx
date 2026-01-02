import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { shortenAddress } from "@/lib/utils";
import { Bell, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, disconnectWallet, connectWallet } = useAuth();
  const { toast } = useToast();
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  
  // Use dapp-kit hooks directly
  const currentAccount = useCurrentAccount();
  const { mutate: disconnectDappKit } = useDisconnectWallet();
  
  // Sync dapp-kit connection state with AuthContext
  useEffect(() => {
    if (currentAccount?.address) {
      // Wallet connected via dapp-kit - sync with AuthContext
      if (!user?.walletAddress || user.walletAddress !== currentAccount.address) {
        console.log('Syncing dapp-kit connection to AuthContext:', currentAccount.address);
        connectWallet(currentAccount.address, 'sui');
        toast({
          title: "Wallet Connected",
          description: `Connected: ${currentAccount.address.substring(0, 8)}...${currentAccount.address.slice(-6)}`,
        });
      }
    }
  }, [currentAccount?.address, user?.walletAddress, connectWallet, toast]);
  
  // Handle disconnect - both dapp-kit and AuthContext
  const handleDisconnect = () => {
    disconnectDappKit();
    disconnectWallet();
  };

  const goToLive = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/live-final.html";
  };

  const goToPromotions = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/promotions-final.html";
  };

  // Check if connected via either dapp-kit or auth context
  const isConnected = !!currentAccount?.address || !!user?.walletAddress;
  const walletAddress = currentAccount?.address || user?.walletAddress;

  return (
    <nav className="bg-gradient-to-r from-[#09181B] via-[#0f1f25] to-[#09181B] border-b border-cyan-900/30 py-3 px-3 md:py-4 md:px-6 flex items-center shadow-lg shadow-cyan-900/20">
      <div className="flex-1 flex items-center">
        {/* Logo - visible on mobile */}
        <Link href="/" className="md:hidden">
          <img 
            src="/logo/suibets-logo.png?v=999" 
            alt="SuiBets Logo" 
            className="h-8"
          />
        </Link>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-10 mx-auto">
          {/* Sports link */}
          <a 
            href="/" 
            className={`${location === "/" ? "text-[#00FFFF]" : "text-white hover:text-[#00FFFF]"} cursor-pointer text-sm lg:text-base`}
          >
            Sports
          </a>
          
          {/* Live link */}
          <a 
            href="/live-events" 
            className="text-black bg-gradient-to-r from-[#00FFFF] to-[#00d9ff] px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg cursor-pointer font-semibold text-sm lg:text-base hover:shadow-lg hover:shadow-cyan-400/50 transition-all duration-300"
          >
            Live<span className="ml-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </a>
          
          {/* Promo link */}
          <a 
            href="/promotions" 
            className="text-white bg-gradient-to-r from-blue-600 to-blue-500 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg cursor-pointer font-semibold text-sm lg:text-base hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
          >
            Promo
          </a>
          
          {/* Buy SBETS link */}
          <a 
            href="https://app.turbos.finance/#/trade?input=0x2::sui::SUI&output=0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-black bg-gradient-to-r from-green-400 to-emerald-500 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg cursor-pointer font-semibold text-sm lg:text-base hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300"
            data-testid="link-buy-sbets"
          >
            Buy SBETS
          </a>
        </div>
      </div>
      
      
      <div className="flex items-center justify-end flex-1 pr-4">
        {isConnected && walletAddress ? (
          <div className="flex items-center">
            {/* Wallet dropdown with address */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-cyan-500/50 bg-cyan-900/20 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 font-medium transition-all duration-300">
                  <span className="hidden sm:inline">{shortenAddress(walletAddress)}</span>
                  <span className="sm:hidden">Wallet</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Your Wallet</DropdownMenuLabel>
                <div className="px-2 py-2 text-sm text-cyan-300">
                  {shortenAddress(walletAddress)}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setLocation('/wallet-dashboard')}
                >
                  Wallet Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setLocation('/bet-history')}
                >
                  My Bets
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setLocation('/dividends')}
                >
                  Dividends
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnect}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Disconnect</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Notification Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:text-[#00FFFF] hover:bg-[#112225] mx-1"
              onClick={() => setIsNotificationsModalOpen(true)}
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center">
            {/* Use dapp-kit's built-in ConnectButton */}
            <ConnectButton 
              connectText="Connect Wallet"
              className="!bg-gradient-to-r !from-cyan-400 !to-cyan-500 hover:!from-cyan-300 hover:!to-cyan-400 !text-black !font-semibold !px-6 !py-2 !rounded-lg !shadow-lg !shadow-cyan-500/40 hover:!shadow-cyan-500/60 !transition-all !duration-300"
            />
            
            {/* Telegram Join Now Button */}
            <a href="https://t.me/Sui_Bets" target="_blank" rel="noopener noreferrer" className="ml-3">
              <Button variant="outline" className="border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF]/20 font-medium">
                Join Telegram
              </Button>
            </a>
          </div>
        )}
      </div>
      
      <NotificationsModal 
        isOpen={isNotificationsModalOpen} 
        onClose={() => setIsNotificationsModalOpen(false)} 
      />
    </nav>
  );
}
