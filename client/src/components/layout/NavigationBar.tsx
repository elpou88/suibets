import { Link } from "wouter";

const NavigationBar = () => {
  return (
    <div className="bg-[#09181B] border-b border-[#112225] p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/">
          <img src="/logo/suibets-logo.svg" alt="SuiBets Logo" className="h-8 mr-10 cursor-pointer" />
        </Link>
      </div>
      
      {/* Only Sports link in the center */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Link href="/" className="text-[#00FFFF] border-b-2 border-[#00FFFF] pb-1">
          Sports
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <Link href="/join" className="text-[#00FFFF] border border-[#00FFFF] px-4 py-2 rounded hover:bg-[#00FFFF]/10">
          Join Now
        </Link>
        <Link href="/connect-wallet" className="bg-[#00FFFF] text-black px-4 py-2 rounded hover:bg-[#00FFFF]/90">
          Connect Wallet
        </Link>
      </div>
    </div>
  );
};

export default NavigationBar;