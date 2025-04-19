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
      className={`py-0 px-0 h-auto min-h-[32px] flex-1 border-0 ${
        isActive 
          ? 'bg-cyan-700 text-white' 
          : 'bg-[#1e3a3f] hover:bg-cyan-700 text-cyan-300'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center w-full p-0">
        <span className="text-[8px] font-medium text-white">{name}</span>
        <span className="text-xs font-bold text-cyan-300">{odds.toFixed(2)}</span>
      </div>
    </Button>
  );
}