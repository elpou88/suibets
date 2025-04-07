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

// NOTE: This component is no longer used - moved to App.tsx
// Keeping for reference but all UI is rendered through MainLayout in App.tsx
export default function Layout({ children }: LayoutProps) {
  return <>{children}</>;
}
