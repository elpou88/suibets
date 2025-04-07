import { ReactNode } from "react";
import NavigationBar from "./NavigationBar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { Grid2X2, Home, User } from "lucide-react";
import { BiFootball } from "react-icons/bi";
import { Link, useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();
  const [location, setLocation] = useLocation();

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar for desktop */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#09181B] text-white z-30 flex justify-around p-2 border-t border-[#112225]">
          <Link href="/" className="p-2 flex flex-col items-center justify-center">
            <Home className="h-6 w-6 text-[#00FFFF]" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/sports" className="p-2 flex flex-col items-center justify-center">
            <BiFootball className="h-6 w-6" />
            <span className="text-xs mt-1">Sports</span>
          </Link>
          <Link href="/live" className="p-2 flex flex-col items-center justify-center">
            <Grid2X2 className="h-6 w-6" />
            <span className="text-xs mt-1">Live</span>
          </Link>
          <Link href="/settings" className="p-2 flex flex-col items-center justify-center">
            <User className="h-6 w-6" />
            <span className="text-xs mt-1">Account</span>
          </Link>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-[#09181B]">
        <NavigationBar />
        <main className="flex-1 p-4 overflow-y-auto pb-20 md:pb-4 bg-[#09181B] text-white">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
