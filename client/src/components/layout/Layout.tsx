import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import Footer from "./Footer";
import { useMobile } from "@/hooks/use-mobile";
import { Grid2X2, Home, User, Menu } from "lucide-react";
import { BiFootball } from "react-icons/bi";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - only visible on non-mobile */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar - only visible on mobile */}
      {isMobile && <MobileSidebar />}
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#09181B] text-white z-30 flex justify-around p-2 border-t border-[#112225]">
          <button className="p-2 flex flex-col items-center justify-center">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="p-2 flex flex-col items-center justify-center">
            <BiFootball className="h-6 w-6" />
            <span className="text-xs mt-1">Sports</span>
          </button>
          <button className="p-2 flex flex-col items-center justify-center">
            <Grid2X2 className="h-6 w-6" />
            <span className="text-xs mt-1">Live</span>
          </button>
          <button className="p-2 flex flex-col items-center justify-center">
            <User className="h-6 w-6" />
            <span className="text-xs mt-1">Account</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-[#09181B]">
        <Navbar />
        <main className="flex-1 p-4 overflow-y-auto pb-20 md:pb-4 bg-[#09181B] text-white">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
