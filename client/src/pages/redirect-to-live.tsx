import { useEffect } from "react";
import { useLocation } from "wouter";

export default function RedirectToLive() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    console.log("Redirecting to live page");
    // Redirect to the live page with a slight delay to ensure navigation works
    setTimeout(() => {
      setLocation("/live");
    }, 100);
  }, [setLocation]);
  
  // Don't display any UI, just redirect silently
  return null;
}