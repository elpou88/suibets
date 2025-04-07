import { useEffect } from "react";

export default function RedirectToLive() {
  useEffect(() => {
    // Directly navigate to the HTML file
    window.location.href = "/live.html";
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <p className="text-gray-400">Redirecting to Live...</p>
    </div>
  );
}