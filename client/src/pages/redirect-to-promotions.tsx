import { useEffect } from "react";

export default function RedirectToPromotions() {
  useEffect(() => {
    // Force navigation to the promotions page
    window.location.href = '/promotions';
  }, []);

  return <div className="w-full h-screen flex items-center justify-center">
    <p className="text-gray-400">Redirecting to Promotions...</p>
  </div>;
}