import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  BarChart,
  Calendar,
  User,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navbar: React.FC = () => {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Check for existing wallet connection on component mount
  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        const response = await fetch('/api/auth/wallet-status');
        const data = await response.json();
        
        if (data.authenticated) {
          setIsConnected(true);
          setWalletAddress(data.wallet.address);
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
      }
    };
    
    checkWalletStatus();
  }, []);

  // Listen for wallet connect/disconnect events
  useEffect(() => {
    const handleWalletConnected = (event: CustomEvent) => {
      setIsConnected(true);
      setWalletAddress(event.detail.address);
    };
    
    const handleWalletDisconnected = () => {
      setIsConnected(false);
      setWalletAddress(null);
    };
    
    window.addEventListener('walletconnected', handleWalletConnected as EventListener);
    window.addEventListener('walletdisconnected', handleWalletDisconnected);
    
    return () => {
      window.removeEventListener('walletconnected', handleWalletConnected as EventListener);
      window.removeEventListener('walletdisconnected', handleWalletDisconnected);
    };
  }, []);

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-2xl text-primary">
            SuiBets
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/">
                  <NavigationMenuLink 
                    className={cn(navigationMenuTriggerStyle(), {
                      'bg-accent': location === '/'
                    })}
                  >
                    <BarChart className="w-4 h-4 mr-2" />
                    Live Events
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/upcoming">
                  <NavigationMenuLink 
                    className={cn(navigationMenuTriggerStyle(), {
                      'bg-accent': location === '/upcoming'
                    })}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Upcoming Events
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/profile">
                  <NavigationMenuLink 
                    className={cn(navigationMenuTriggerStyle(), {
                      'bg-accent': location === '/profile'
                    })}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {isConnected 
                      ? `Profile (${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)})` 
                      : 'Profile'
                    }
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Mobile navigation */}
        <div className="flex md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-4 py-4">
                <Link href="/">
                  <Button 
                    variant={location === '/' ? 'default' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <BarChart className="w-4 h-4 mr-2" />
                    Live Events
                  </Button>
                </Link>
                <Link href="/upcoming">
                  <Button 
                    variant={location === '/upcoming' ? 'default' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Upcoming Events
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button 
                    variant={location === '/profile' ? 'default' : 'ghost'} 
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {isConnected 
                      ? `Profile (${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)})` 
                      : 'Profile'
                    }
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;