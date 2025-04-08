import { useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { shortenAddress } from "@/lib/utils";
import { Bell, Settings, LogOut } from "lucide-react";
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
  const { user, isAuthenticated, disconnectWallet } = useAuth();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Direct navigation to static HTML files
  const goToSports = () => {
    window.location.href = "/sports-final.html";
  };

  const goToLive = () => {
    window.location.href = "/live-final.html";
  };

  const goToPromotions = () => {
    window.location.href = "/promotions-final.html";
  };

  return (
    <nav className="bg-[#09181B] border-b border-[#112225] py-3 px-4 flex items-center">
      <div className="flex-1 flex items-center">
        <div className="w-[120px]"></div> {/* Spacer */}
        
        <div className="flex items-center space-x-10 mx-auto">
          {/* Sports link */}
          <a 
            onClick={goToSports}
            className={`${location === "/" ? "text-[#00FFFF]" : "text-white hover:text-[#00FFFF]"} cursor-pointer`}
          >
            Sports
            {location === "/" && (
              <div className="absolute -bottom-3 left-0 w-full h-1 bg-[#00FFFF]"></div>
            )}
          </a>
          
          {/* Live link - with direct navigation */}
          <a 
            onClick={goToLive} 
            className="text-black bg-[#00FFFF] px-3 py-1 rounded cursor-pointer"
          >
            Live<span className="ml-1 inline-block w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
          </a>
          
          {/* Promotions link - with direct navigation */}
          <a 
            onClick={goToPromotions} 
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
        {isAuthenticated ? (
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
                <Button variant="outline" className="ml-3 border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black">
                  {user?.walletAddress && shortenAddress(user.walletAddress)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>My Bets</DropdownMenuItem>
                <DropdownMenuItem>Transactions</DropdownMenuItem>
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
            <Button className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black font-medium ml-3" onClick={() => setIsWalletModalOpen(true)}>
              Connect Wallet
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
