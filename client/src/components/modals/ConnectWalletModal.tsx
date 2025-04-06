import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConnectWalletModalProps } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { WALLET_TYPES } from "@/lib/utils";
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { useWurlusProtocol } from "@/hooks/useWurlusProtocol";
import { useToast } from "@/hooks/use-toast";

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { connectWallet } = useAuth();
  const { connectToWurlusProtocol, checkRegistrationStatus, error } = useWurlusProtocol();
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'selecting' | 'connecting' | 'registering'>('selecting');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleConnectWallet = async (walletId: string) => {
    try {
      setSelectedWallet(walletId);
      setConnectionStep('connecting');
      setConnecting(true);
      
      // In a real application, this would connect to the actual wallet
      // and get the real wallet address
      const mockAddress = `0x${Math.random().toString(36).substring(2, 15)}`;
      
      // Check if this wallet is already registered with the Wurlus protocol
      const isRegistered = await checkRegistrationStatus(mockAddress);
      
      if (!isRegistered) {
        setConnectionStep('registering');
        
        // Register the wallet with the Wurlus protocol
        const connected = await connectToWurlusProtocol(mockAddress);
        
        if (!connected) {
          toast({
            title: "Registration Failed",
            description: "Failed to register wallet with Wurlus protocol. Please try again.",
            variant: "destructive",
          });
          setConnectionStep('selecting');
          setConnecting(false);
          return;
        }
        
        toast({
          title: "Wallet Registered",
          description: "Successfully registered with Wurlus protocol!",
        });
      }
      
      // Connect the wallet with the application
      await connectWallet(mockAddress, walletId as any);
      
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected!",
      });
      
      onClose();
    } catch (err) {
      console.error("Error connecting wallet:", err);
      toast({
        title: "Connection Failed",
        description: error || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
      setConnectionStep('selecting');
    }
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

        {connectionStep === 'selecting' ? (
          <div className="space-y-3 py-4">
            {WALLET_TYPES.map((wallet) => (
              <Button
                key={wallet.id}
                variant="outline"
                className="w-full justify-between py-6 px-4"
                onClick={() => handleConnectWallet(wallet.id)}
                disabled={connecting}
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
        ) : (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center">
              <h3 className="font-medium text-lg">
                {connectionStep === 'connecting' ? 'Connecting Wallet' : 'Registering with Wurlus Protocol'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {connectionStep === 'connecting' 
                  ? 'Please approve the connection in your wallet...' 
                  : 'Registering your wallet with the Wurlus protocol...'}
              </p>
            </div>
            {selectedWallet && (
              <div className="flex items-center mt-2">
                <div className={`w-6 h-6 ${WALLET_TYPES.find(w => w.id === selectedWallet)?.color} rounded-full flex items-center justify-center text-white mr-2`}>
                  {WALLET_TYPES.find(w => w.id === selectedWallet)?.name[0]}
                </div>
                <span>{WALLET_TYPES.find(w => w.id === selectedWallet)?.name}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

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
