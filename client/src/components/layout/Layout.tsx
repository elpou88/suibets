import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useMobile } from "@/hooks/use-mobile";
import { Grid2X2, ChevronRight, Home, User, Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-secondary text-white z-30 flex justify-around p-2">
          <button className="p-2 rounded-full bg-primary text-secondary">
            <Menu className="h-6 w-6" />
          </button>
          <button className="p-2">
            <Home className="h-6 w-6" />
          </button>
          <button className="p-2">
            <ChevronRight className="h-6 w-6" />
          </button>
          <button className="p-2">
            <User className="h-6 w-6" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-4 overflow-y-auto pb-20 md:pb-4">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
