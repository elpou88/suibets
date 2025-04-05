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
    <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div className="flex space-x-6">
        <Link href="/">
          <a className={`border-b-2 px-1 ${location === "/" ? "text-primary border-primary" : "text-gray-500 border-transparent hover:border-primary hover:text-primary"}`}>
            Sports
          </a>
        </Link>
        <Link href="/?live=true">
          <a className={`border-b-2 px-1 flex items-center ${location === "/?live=true" ? "text-primary border-primary" : "text-gray-500 border-transparent hover:border-primary hover:text-primary"}`}>
            Live 
            <span className="ml-1 w-2 h-2 bg-red-500 rounded-full inline-block live-pulse"></span>
          </a>
        </Link>
        <Link href="/promotions">
          <a className={`border-b-2 px-1 ${location === "/promotions" ? "text-primary border-primary" : "text-gray-500 border-transparent hover:border-primary hover:text-primary"}`}>
            Promotions
          </a>
        </Link>
      </div>
      
      <div className="flex items-center space-x-3">
        {isAuthenticated ? (
          <>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsNotificationsModalOpen(true)}
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-2">
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
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Join Now
              </Button>
            </Link>
            <Button onClick={() => setIsWalletModalOpen(true)}>
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
