import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConnectWalletModalProps } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { WALLET_TYPES } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { connectWallet } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleConnectWallet = async (walletId: string) => {
    // Wallet address would normally come from the actual wallet provider
    // Here we're just using a mock address for demonstration
    const mockAddress = `0x${Math.random().toString(36).substring(2, 15)}`;
    await connectWallet(mockAddress, walletId as any);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect with one of our available wallet providers to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {WALLET_TYPES.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              className="w-full justify-between py-6 px-4"
              onClick={() => handleConnectWallet(wallet.id)}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 ${wallet.color} rounded-full flex items-center justify-center text-white mr-3`}>
                  {wallet.name[0]}
                </div>
                <span className="font-medium">{wallet.name}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Button>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            By connecting a wallet, you agree to SuiBets'&nbsp;
            <Button variant="link" className="p-0 h-auto text-primary">
              Terms of Service
            </Button>
            &nbsp;and&nbsp;
            <Button variant="link" className="p-0 h-auto text-primary">
              Privacy Policy
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
