import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  const [location] = useLocation();
  const { user, isAuthenticated, disconnectWallet } = useAuth();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <nav className="bg-[#09181B] border-b border-[#112225] py-3 px-4 flex justify-between items-center">
      <div className="flex space-x-8">
        <Link href="/">
          <div className={`relative px-3 py-1 ${location === "/" ? "text-[#00FFFF]" : "text-white hover:text-[#00FFFF]"}`}>
            Sports
            {location === "/" && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00FFFF]"></div>
            )}
          </div>
        </Link>
        <Link href="/?live=true">
          <div className={`relative px-3 py-1 flex items-center ${location === "/?live=true" ? "text-[#00FFFF]" : "text-white hover:text-[#00FFFF]"}`}>
            Live 
            <span className="ml-1 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse"></span>
            {location === "/?live=true" && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00FFFF]"></div>
            )}
          </div>
        </Link>
        <a 
          href="/promotions-page.html" 
          className="relative px-3 py-1 text-white hover:text-[#00FFFF] cursor-pointer"
        >
          <div className="relative px-3 py-1 text-white hover:text-[#00FFFF]">
            Promotions
          </div>
        </a>
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
      
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:text-[#00FFFF] hover:bg-[#112225]"
              onClick={() => setIsNotificationsModalOpen(true)}
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:text-[#00FFFF] hover:bg-[#112225]"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-2 border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-black">
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
            <Link href="/join">
              <Button variant="outline" className="border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF]/20 font-medium">
                Join Now
              </Button>
            </Link>
            <Button className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black font-medium" onClick={() => setIsWalletModalOpen(true)}>
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
