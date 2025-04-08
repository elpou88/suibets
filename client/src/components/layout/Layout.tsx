import React, { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Home, TrendingUp, Megaphone, Bell, Settings, 
  Clock, Wallet, ChevronLeft
} from 'lucide-react';

export interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showBackButton = false
}) => {
  const [location, setLocation] = useLocation();
  
  const navItems = [
    { label: 'Home', icon: <Home />, href: '/home-real' },
    { label: 'Live', icon: <TrendingUp />, href: '/live-real' },
    { label: 'Promotions', icon: <Megaphone />, href: '/promotions' },
    { label: 'Notifications', icon: <Bell />, href: '/notifications' },
    { label: 'History', icon: <Clock />, href: '/bet-history' },
    { label: 'Settings', icon: <Settings />, href: '/settings' },
  ];

  const handleBack = () => {
    window.history.back();
  };
  
  return (
    <div className="min-h-screen bg-[#112225] text-white pb-16 lg:pb-0">
      {/* Header */}
      <header className="bg-[#0b1618] border-b border-[#1e3a3f] p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 text-cyan-400"
                onClick={handleBack}
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </Button>
            ) : (
              <div className="font-bold text-xl text-cyan-400">
                {title || "Wurlus Betting"}
              </div>
            )}
            {showBackButton && title && (
              <h1 className="text-xl font-semibold">{title}</h1>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              className="border-[#1e3a3f] bg-[#112225] text-white"
              onClick={() => setLocation('/connect-wallet')}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="container mx-auto p-4">
        {children}
      </div>
      
      {/* Mobile bottom navigation (visible on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0b1618] border-t border-[#1e3a3f] z-50">
        <div className="flex justify-around p-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className={`flex flex-col items-center py-2 ${
                location === item.href 
                  ? 'text-cyan-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setLocation(item.href)}
            >
              {React.cloneElement(item.icon as React.ReactElement, { 
                className: 'h-5 w-5 mb-1' 
              })}
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Layout;