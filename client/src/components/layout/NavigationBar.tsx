import FixedNavbar from "@/components/ui/FixedNavbar";

const NavigationBar = () => {
  return (
    <div className="bg-[#09181B] border-b border-[#112225] p-4 flex justify-between items-center">
      <div className="flex items-center">
        <img src="/logo/suibets-logo.svg" alt="SuiBets Logo" className="h-8 mr-10" />
      </div>
      
      {/* Using our FixedNavbar component which uses direct DOM manipulation */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <FixedNavbar />
      </div>
      
      <div className="flex items-center gap-4">
        <a href="/join" className="text-[#00FFFF] border border-[#00FFFF] px-4 py-2 rounded hover:bg-[#00FFFF]/10">
          Join Now
        </a>
        <a href="/connect-wallet" className="bg-[#00FFFF] text-black px-4 py-2 rounded hover:bg-[#00FFFF]/90">
          Connect Wallet
        </a>
      </div>
    </div>
  );
};

export default NavigationBar;