import { Button } from "@/components/ui/button";

export function SpecialLinks() {
  const openPromoPage = () => {
    window.open("/promotions.html", "_blank");
  };
  
  const openLivePage = () => {
    window.open("/live.html", "_blank");
  };
  
  return (
    <div className="flex flex-col gap-4 p-4 fixed top-1/4 right-8 z-50">
      <Button
        className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black font-bold py-3 px-6 rounded-lg shadow-lg"
        onClick={openPromoPage}
      >
        View Promotions
      </Button>
      
      <Button
        className="bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black font-bold py-3 px-6 rounded-lg shadow-lg"
        onClick={openLivePage}
      >
        View Live
      </Button>
    </div>
  );
}