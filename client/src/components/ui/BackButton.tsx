import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  to: string;
  label?: string;
  className?: string;
  position?: "absolute" | "relative";
  variant?: "default" | "subtle" | "minimal";
}

/**
 * Reusable back button component that can be used across the application
 * with consistent styling but configurable appearance and behavior
 */
export default function BackButton({
  to,
  label = "Back",
  className,
  position = "absolute",
  variant = "default"
}: BackButtonProps) {
  const [, setLocation] = useLocation();
  
  // Determine styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case "subtle":
        return "bg-black/30 text-white hover:bg-black/50";
      case "minimal":
        return "bg-transparent text-white hover:bg-black/20";
      default:
        return "bg-black/50 text-white hover:bg-black/70";
    }
  };
  
  // Determine position styles
  const getPositionStyles = () => {
    return position === "absolute" ? "absolute top-4 left-4" : "relative";
  };
  
  return (
    <button 
      onClick={() => setLocation(to)}
      className={cn(
        "px-3 py-2 rounded-lg transition-colors flex items-center gap-1",
        getVariantStyles(),
        getPositionStyles(),
        className
      )}
      aria-label={`Back to ${to}`}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </button>
  );
}