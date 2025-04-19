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
      className={`py-1 px-2 h-auto min-h-[40px] min-w-[45px] mx-[1px] ${
        isActive 
          ? 'bg-cyan-700 border-cyan-500 text-white' 
          : 'bg-[#1e3a3f] border-cyan-900 hover:bg-cyan-700 hover:border-cyan-500 text-cyan-300'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center w-full">
        <span className="text-[10px] font-medium text-white mb-0 whitespace-nowrap">{name}</span>
        <span className="text-sm font-bold text-cyan-300 whitespace-nowrap">{odds.toFixed(2)}</span>
      </div>
    </Button>
  );
}