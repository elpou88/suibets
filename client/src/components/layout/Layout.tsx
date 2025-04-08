import React, { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Home, TrendingUp, Megaphone, Bell, Settings, 
  Clock, Wallet, ChevronLeft, CircleDollarSign, 
  TrendingDown, Trophy, Search, MenuIcon
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
  
  const topNavItems = [
    { label: 'Sports', icon: <TrendingUp />, href: '/home-real' },
    { label: 'Live', icon: <TrendingDown />, href: '/live-real' },
    { label: 'Promotions', icon: <Megaphone />, href: '/promotions' },
  ];

  const bottomNavItems = [
    { label: 'Home', icon: <Home />, href: '/home-real' },
    { label: 'Live', icon: <TrendingUp />, href: '/live-real' },
    { label: 'Dividends', icon: <CircleDollarSign />, href: '/dividends' },
    { label: 'History', icon: <Clock />, href: '/bet-history' },
    { label: 'Settings', icon: <Settings />, href: '/settings' },
  ];

  const handleBack = () => {
    window.history.back();
  };
  
  return (
    <div className="min-h-screen bg-[#112225] text-white pb-16 lg:pb-0">
      {/* Top Header - like bet365 */}
      <header className="bg-[#0b1618] border-b border-[#1e3a3f]">
        {/* Upper section with logo and login */}
        <div className="px-4 py-3 flex items-center justify-between">
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
                SuiBets
              </div>
            )}
            {showBackButton && title && (
              <h1 className="text-xl font-semibold">{title}</h1>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-[#1e3a3f] bg-[#112225] text-white text-xs"
              onClick={() => setLocation('/join')}
            >
              Join Now
            </Button>
            <Button 
              variant="default" 
              size="sm"
              className="bg-[#00ffff] hover:bg-[#00d8d8] text-black text-xs"
              onClick={() => setLocation('/connect-wallet')}
            >
              <Wallet className="mr-2 h-3 w-3" />
              Connect Wallet
            </Button>
          </div>
        </div>

        {/* Navigation items in header like bet365 */}
        <div className="flex items-center overflow-x-auto hide-scrollbar border-t border-[#1e3a3f]">
          {topNavItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`rounded-none border-r border-[#1e3a3f] h-12 px-4 flex items-center ${
                location === item.href 
                  ? 'text-cyan-400 border-b-2 border-b-cyan-400' 
                  : 'text-gray-300'
              }`}
              onClick={() => setLocation(item.href)}
            >
              {React.cloneElement(item.icon as React.ReactElement, { 
                className: 'h-4 w-4 mr-2' 
              })}
              {item.label}
            </Button>
          ))}

          <div className="ml-auto flex items-center p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 rounded-full text-gray-300"
              onClick={() => setLocation('/notifications')}
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 rounded-full text-gray-300"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 rounded-full text-gray-300 md:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Display title if provided and not showing back button */}
      {title && !showBackButton && (
        <div className="container mx-auto px-4 pt-4">
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      )}
      
      {/* Main content */}
      <div className="container mx-auto p-4">
        {children}
      </div>
      
      {/* Mobile bottom navigation (visible on small screens) - like bet365 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0b1618] border-t border-[#1e3a3f] z-50">
        <div className="flex justify-around p-1">
          {bottomNavItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`flex flex-col items-center justify-center py-1 h-16 w-full ${
                location === item.href 
                  ? 'text-cyan-400 border-t-2 border-cyan-400 bg-opacity-10 bg-cyan-800' 
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