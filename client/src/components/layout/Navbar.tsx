import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { shortenAddress } from "@/lib/utils";
import { Bell, Settings, LogOut } from "lucide-react";
import { useWalletAdapter } from "@/components/wallet/WalletAdapter";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, disconnectWallet, connectWallet } = useAuth();
  const { connect: connectAdapter, address, isConnected } = useWalletAdapter();
  const { toast } = useToast();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAttemptingConnection, setIsAttemptingConnection] = useState(false);
  
  // Debug wallet status in console
  useEffect(() => {
    console.log('Navbar: User state updated -', {
      user,
      userWalletAddress: user?.walletAddress,
      isAuthenticated,
      hasWalletAddress: !!user?.walletAddress,
      walletAdapterAddress: address,
      walletAdapterIsConnected: isConnected
    });
  }, [user, isAuthenticated, address, isConnected]);
  
  // Listen for wallet connection requests from other components
  useEffect(() => {
    const handleWalletConnectionRequired = () => {
      console.log('Wallet connection requested from another component');
      if (!user?.walletAddress) {
        // Open the wallet modal directly
        setIsWalletModalOpen(true);
      }
    };
    
    window.addEventListener('suibets:connect-wallet-required', handleWalletConnectionRequired);
    return () => {
      window.removeEventListener('suibets:connect-wallet-required', handleWalletConnectionRequired);
    };
  }, [user?.walletAddress]);
  
  // Open connect wallet modal directly (no connection attempt first)
  const attemptQuickWalletConnection = (e?: React.MouseEvent) => {
    // Prevent default behavior to avoid page navigation
    if (e) e.preventDefault();
    
    if (isAttemptingConnection) return; // Prevent multiple attempts
    
    try {
      console.log('Connect wallet button clicked, opening modal directly');
      
      // Set the wallet modal to open
      setIsWalletModalOpen(true);
    } catch (error) {
      console.error('Error opening wallet modal:', error);
      // Still try to open the modal even if there was an error
      setIsWalletModalOpen(true);
    }
  };

  const goToLive = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/live-final.html";
  };

  const goToPromotions = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/promotions-final.html";
  };

  return (
    <nav className="bg-gradient-to-r from-[#09181B] via-[#0f1f25] to-[#09181B] border-b border-cyan-900/30 py-4 px-6 flex items-center shadow-lg shadow-cyan-900/20">
      <div className="flex-1 flex items-center">
        <div className="w-[120px]"></div> {/* Spacer */}
        
        <div className="flex items-center space-x-10 mx-auto">
          {/* Sports link - simple text link */}
          <a 
            href="/" 
            className={`${location === "/" ? "text-[#00FFFF]" : "text-white hover:text-[#00FFFF]"} cursor-pointer`}
          >
            Sports
            {location === "/" && (
              <div className="absolute -bottom-3 left-0 w-full h-1 bg-[#00FFFF]"></div>
            )}
          </a>
          
          {/* Live link - Enhanced */}
          <a 
            href="/live-final.html" 
            className="text-black bg-gradient-to-r from-[#00FFFF] to-[#00d9ff] px-4 py-2 rounded-lg cursor-pointer font-semibold hover:shadow-lg hover:shadow-cyan-400/50 transition-all duration-300 transform hover:scale-105"
          >
            Live<span className="ml-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </a>
          
          {/* Promo link - Enhanced */}
          <a 
            href="/promotions-final.html" 
            className="text-white bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 rounded-lg cursor-pointer font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Promo
          </a>
          
          {/* Buy SBETS link - Enhanced */}
          <a 
            href="https://app.turbos.finance/#/trade?input=0x2::sui::SUI&output=0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-black bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2 rounded-lg cursor-pointer font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105"
            data-testid="link-buy-sbets"
          >
            Buy SBETS
          </a>
        </div>
      </div>
      
      {/* Logo in center - only visible on mobile */}
      <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
        <Link href="/">
          <img 
            src="/logo/suibets-logo.png?v=999" 
            alt="SuiBets Logo" 
            className="h-8"
            onError={(e) => console.log('Logo loading:', e)}
          />
        </Link>
      </div>
      
      <div className="flex items-center justify-end flex-1 pr-4">
        {/* Place wallet connection button before bell/settings icons */}
        {user?.walletAddress ? (
          <div className="flex items-center">
            {/* Wallet dropdown with address */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-cyan-500/50 bg-cyan-900/20 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 font-medium transition-all duration-300">
                  <span className="hidden sm:inline">{shortenAddress(user.walletAddress)}</span>
                  <span className="sm:hidden">Wallet</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Your Wallet</DropdownMenuLabel>
                <div className="px-2 py-2 text-sm text-cyan-300">
                  {shortenAddress(user.walletAddress)}
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
                <DropdownMenuItem onClick={disconnectWallet}>
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
            
            {/* Settings Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:text-[#00FFFF] hover:bg-[#112225] mx-1"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center">
            {/* Connect Wallet Button - Enhanced */}
            <Button 
              className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-semibold px-6 py-2 rounded-lg shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all duration-300 transform hover:scale-105" 
              onClick={attemptQuickWalletConnection}
              disabled={isAttemptingConnection}
            >
              {isAttemptingConnection ? 'Connecting...' : 'Connect Wallet'}
            </Button>
            
            {/* Telegram Join Now Button */}
            <a href="https://t.me/Sui_Bets" target="_blank" rel="noopener noreferrer" className="ml-3">
              <Button variant="outline" className="border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF]/20 font-medium">
                Join Telegram
              </Button>
            </a>
          </div>
        )}
      </div>

      <ConnectWalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
      
      <NotificationsModal 
        isOpen={isNotificationsModalOpen} 
        onClose={() => setIsNotificationsModalOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </nav>
  );
}
