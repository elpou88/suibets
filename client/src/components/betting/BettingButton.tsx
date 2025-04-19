import { Button } from "@/components/ui/button";

interface BettingButtonProps {
  name: string;
  odds: number;
  onClick: () => void;
  isActive?: boolean;
}

export function BettingButton({ name, odds, onClick, isActive = false }: BettingButtonProps) {
  return (
    <Button
      variant="outline"
      className={`py-0 px-0 h-5 min-h-0 flex-1 border-0 shadow-none ${
        isActive 
          ? 'bg-cyan-700 text-white' 
          : 'bg-[#112225] hover:bg-cyan-700 text-cyan-300'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center w-full p-0 m-0 h-full">
        <span className="text-[7px] leading-none font-medium text-white mb-[1px]">{name}</span>
        <span className="text-[9px] leading-none font-bold text-cyan-300">{odds.toFixed(2)}</span>
      </div>
    </Button>
  );
}