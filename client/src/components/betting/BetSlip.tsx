import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBetting } from "@/context/BettingContext";
import { useAuth } from "@/context/AuthContext";
import { formatOdds, formatCurrency } from "@/lib/utils";
import { Trash2, X } from "lucide-react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";

export function BetSlip() {
  const { selectedBets, removeBet, clearBets, placeBet, totalStake, potentialWinnings, updateStake } = useBetting();
  const { isAuthenticated } = useAuth();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (selectedBets.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Bet Slip</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          <p>No bets selected</p>
          <p className="text-sm mt-2">Select odds to add to bet slip</p>
        </CardContent>
      </Card>
    );
  }

  const handleStakeChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      updateStake(id, numValue);
    } else if (value === "") {
      updateStake(id, 0);
    }
  };

  const handlePlaceBet = async () => {
    if (!isAuthenticated) {
      setIsWalletModalOpen(true);
      return;
    }

    if (totalStake <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await placeBet(totalStake);
      if (success) {
        // Bet placed successfully, already handled in context
      }
    } catch (error) {
      console.error("Error placing bet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Bet Slip ({selectedBets.length})</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearBets}
            className="h-8 px-2 text-gray-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {selectedBets.map((bet) => (
              <div
                key={bet.id}
                className="border border-gray-200 rounded-md p-3 relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBet(bet.id)}
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="pr-6">
                  <p className="font-medium text-sm">{bet.eventName}</p>
                  <p className="text-gray-500 text-xs">{bet.market}</p>
                  <p className="text-sm mt-1">{bet.selectionName}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-semibold">{formatOdds(bet.odds)}</span>
                    <Input
                      type="number"
                      value={bet.stake || ""}
                      onChange={(e) => handleStakeChange(bet.id, e.target.value)}
                      className="w-20 h-8 text-right"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="w-full flex justify-between text-sm py-2">
            <span>Total Stake:</span>
            <span>{formatCurrency(totalStake)}</span>
          </div>
          <div className="w-full flex justify-between text-sm py-2 font-semibold">
            <span>Potential Winnings:</span>
            <span>{formatCurrency(potentialWinnings)}</span>
          </div>
          <Button
            className="w-full mt-2"
            onClick={handlePlaceBet}
            disabled={isSubmitting || totalStake <= 0}
          >
            {isSubmitting ? "Placing Bet..." : "Place Bet"}
          </Button>
        </CardFooter>
      </Card>

      <ConnectWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
