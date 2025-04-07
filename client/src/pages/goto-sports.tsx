import { useEffect } from "react";
import { useLocation } from "wouter";

export default function GotoSports() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    console.log("Redirecting to sports/home page");
    // Redirect to the home/sports page with a slight delay to ensure navigation works
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  }, [setLocation]);
  
  return <div className="h-screen flex items-center justify-center">Redirecting to sports...</div>;
}