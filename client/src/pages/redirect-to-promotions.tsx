import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * This component is a simple wrapper that redirects to the promotions page
 * It provides a smoother user experience by showing a loading spinner during the transition
 */
export default function RedirectToPromotions() {
  const [, setLocation] = useLocation();

  // Redirect to promotions page after a short delay to show loading animation
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      setLocation("/promotions");
    }, 500); // Short delay for visual feedback

    return () => clearTimeout(redirectTimer);
  }, [setLocation]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-medium">Redirecting to promotions...</p>
    </div>
  );
}