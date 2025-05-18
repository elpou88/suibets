import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-primary text-primary-foreground py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold">SuiBets</span>
          <span className="bg-primary-foreground text-primary text-xs px-2 py-0.5 rounded-full">LIVE</span>
        </div>
        <div className="space-x-4">
          <Link href="/">
            <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground/80">
              Live Events
            </Button>
          </Link>
          <Link href="/upcoming">
            <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground/80">
              Upcoming
            </Button>
          </Link>
          <Link href="/bet-slip">
            <Button variant="outline" className="bg-primary-foreground text-primary">
              Bet Slip
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;