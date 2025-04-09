import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { shortenAddress } from "@/lib/utils";
import { Bell, Settings, LogOut, Wallet } from "lucide-react";
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
        attemptQuickWalletConnection();
      }
    };
    
    window.addEventListener('suibets:connect-wallet-required', handleWalletConnectionRequired);
    return () => {
      window.removeEventListener('suibets:connect-wallet-required', handleWalletConnectionRequired);
    };
  }, [user?.walletAddress]);
  
  // Attempt quick wallet connection with demo wallet
  const attemptQuickWalletConnection = async () => {
    if (isAttemptingConnection) return; // Prevent multiple attempts
    
    try {
      setIsAttemptingConnection(true);
      
      // Ensure demo wallet mode is enabled
      localStorage.setItem('use_demo_wallet', 'true');
      
      // Connect using the wallet adapter
      await connectAdapter();
      
      // Wait for connection to be established
      setTimeout(async () => {
        if (address && isConnected) {
          console.log('Quick wallet connection successful:', address);
          
          // Sync with auth context
          await connectWallet(address, 'sui');
          
          toast({
            title: 'Wallet Connected',
            description: 'Demo wallet connected automatically',
          });
        } else {
          console.log('Quick wallet connection failed - opening modal');
          setIsWalletModalOpen(true);
        }
        setIsAttemptingConnection(false);
      }, 500);
    } catch (error) {
      console.error('Quick wallet connection error:', error);
      setIsAttemptingConnection(false);
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
    <nav className="bg-[#09181B] border-b border-[#112225] py-3 px-4 flex items-center">
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
          
          {/* Live link - direct text */}
          <a 
            href="/live-final.html" 
            className="text-black bg-[#00FFFF] px-3 py-1 rounded cursor-pointer"
          >
            Live<span className="ml-1 inline-block w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
          </a>
          
          {/* Promotions link - direct text */}
          <a 
            href="/promotions-final.html" 
            className="text-black bg-[#00FFFF] px-3 py-1 rounded cursor-pointer"
          >
            Promo
          </a>
        </div>
      </div>
      
      {/* Logo in center - only visible on mobile */}
      <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
        <Link href="/">
          <img 
            src="/logo/suibets-logo.svg" 
            alt="SuiBets Logo" 
            className="h-8"
          />
        </Link>
      </div>
      
      <div className="flex items-center justify-end flex-1 pr-4">
        {user?.walletAddress ? (
          <>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:text-[#00FFFF] hover:bg-[#112225] mx-1"
              onClick={() => setIsNotificationsModalOpen(true)}
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:text-[#00FFFF] hover:bg-[#112225] mx-1"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-3 border-[#00FFFF] bg-[#112225] text-[#00FFFF] hover:bg-[#00FFFF]/20">
                  <Wallet className="h-4 w-4 mr-2" />
                  {shortenAddress(user.walletAddress)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/bet-history">My Bets</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dividends">Dividends</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/defi-staking">DeFi Staking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/storage">Storage Vaults</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnectWallet}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Disconnect</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Link href="/join" className="mx-1">
              <Button variant="outline" className="border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF]/20 font-medium">
                Join Now
              </Button>
            </Link>
            <Button 
              className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black font-medium ml-3" 
              onClick={attemptQuickWalletConnection}
              disabled={isAttemptingConnection}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {isAttemptingConnection ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </>
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
