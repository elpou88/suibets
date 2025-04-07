import { Button } from "@/components/ui/button";

export function SpecialLinks() {
  const openPromoPage = () => {
    window.open("/promotions.html", "_blank");
  };
  
  const openLivePage = () => {
    window.open("/live.html", "_blank");
  };
  
  return (
    <div className="flex flex-col gap-3 p-2 fixed top-1/3 right-4 z-50">
      <Button
        size="sm"
        className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black font-bold rounded-md shadow-md text-xs"
        onClick={openPromoPage}
      >
        Promo
      </Button>
      
      <Button
        size="sm"
        className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black font-bold rounded-md shadow-md text-xs"
        onClick={openLivePage}
      >
        Live
      </Button>
    </div>
  );
}