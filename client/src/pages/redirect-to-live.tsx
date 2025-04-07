import { useEffect } from "react";
import liveImg from "@assets/Live (2).png";

export default function RedirectToLive() {
  useEffect(() => {
    // This can be uncommented when you have a real live.html
    // window.location.href = "/live.html";
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#09181B]">
      <img 
        src={liveImg} 
        alt="Live" 
        className="max-w-full h-auto"
      />
    </div>
  );
}