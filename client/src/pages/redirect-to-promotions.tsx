import { useEffect } from "react";
import promotionsImg from "@assets/Promotions (2).png";

export default function RedirectToPromotions() {
  useEffect(() => {
    // This can be uncommented when you have a real promotions.html
    // window.location.href = "/promotions.html";
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#09181B]">
      <img 
        src={promotionsImg} 
        alt="Promotions" 
        className="max-w-full h-auto"
      />
    </div>
  );
}