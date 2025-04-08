import { useEffect } from "react";
import { useLocation } from "wouter";

export default function GotoSports() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    console.log("Redirecting to sports-exact page");
    // Redirect to the sports-exact page which has the proper navigation
    setTimeout(() => {
      window.location.href = '/sports-exact';
    }, 100);
  }, [setLocation]);
  
  return <div className="h-screen flex items-center justify-center">Redirecting to sports...</div>;
}