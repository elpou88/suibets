import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { WALLET_TYPES } from "@/lib/utils";
import { ChevronRight, AlertCircle, Loader2, WalletIcon } from "lucide-react";
import { useWurlusProtocol } from "@/hooks/useWurlusProtocol";
import { useToast } from "@/hooks/use-toast";
import { useWalletAdapter } from "@/components/wallet/WalletAdapter";

// Define the props interface here instead of importing from types
interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { user, connectWallet } = useAuth();
  const { connect: connectAdapter, address, isConnected, error: walletError } = useWalletAdapter();
  const { connectToWurlusProtocol, checkRegistrationStatus, error: wurlusError } = useWurlusProtocol();
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'selecting' | 'connecting' | 'registering'>('selecting');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Update UI if wallet connection state changes
  useEffect(() => {
    if (isConnected && address) {
      // Handle successful connection from wallet adapter
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.substring(0, 8)}...${address.substring(address.length - 6)}`,
      });
      
      if (connectWallet) {
        // Sync the wallet connection with auth context
        connectWallet(address, 'sui')
          .then(() => {
            console.log('Wallet synced with auth context');
          })
          .catch((syncError) => {
            console.error('Error syncing wallet with auth:', syncError);
          });
      }
      
      setConnecting(false);
      setConnectionStep('selecting');
      onClose();
    }
  }, [isConnected, address, connectWallet, onClose]);
  
  // Update UI if there's an error from the wallet adapter
  useEffect(() => {
    if (walletError) {
      setError(walletError);
      setConnecting(false);
      setConnectionStep('selecting');
    }
  }, [walletError]);

  const handleConnectWallet = async (walletId: string) => {
    try {
      setSelectedWallet(walletId);
      setConnectionStep('connecting');
      setConnecting(true);
      setError(null);
      
      console.log('Initiating wallet connection for:', walletId);
      
      // Connect using the wallet adapter
      await connectAdapter();
      
      // The rest of the connection process is handled by the useEffect hooks above
      // that monitor the wallet adapter state changes
      
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err?.message || wurlusError || "Failed to connect wallet. Please try again.");
      toast({
        title: "Connection Failed",
        description: err?.message || wurlusError || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
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
                key={wallet.key}
                variant="outline"
                className="w-full justify-between py-6 px-4"
                onClick={() => handleConnectWallet(wallet.key)}
                disabled={connecting}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white mr-3`}>
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
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white mr-2">
                  {WALLET_TYPES.find(w => w.key === selectedWallet)?.name[0] || '?'}
                </div>
                <span>{WALLET_TYPES.find(w => w.key === selectedWallet)?.name || 'Wallet'}</span>
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
          
          {window.location.hostname.includes("replit") && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
              <p className="mb-2 text-gray-600 dark:text-gray-400">Wallet Connection Options:</p>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {localStorage.getItem('use_demo_wallet') === 'true' 
                    ? '🔄 Using demo wallet in Replit' 
                    : '✅ Using real Sui wallets'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    // Toggle "use demo wallet" flag
                    const currentValue = localStorage.getItem('use_demo_wallet') === 'true';
                    localStorage.setItem('use_demo_wallet', (!currentValue).toString());
                    toast({
                      title: currentValue ? 'Using Real Sui Wallets' : 'Using Demo Wallet',
                      description: currentValue 
                        ? 'Will attempt to connect to real Sui wallets' 
                        : 'Switched to demo wallet mode for testing',
                      variant: 'default',
                    });
                    // Reload the page to apply changes immediately
                    window.location.reload();
                  }}
                >
                  {localStorage.getItem('use_demo_wallet') === 'true' 
                    ? 'Use Real Sui Wallets' 
                    : 'Switch to Demo Wallet'}
                </Button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-[10px]">
                Note: To use real wallets, you'll need a Sui wallet browser extension like SUI Wallet or Ethos Wallet.
                After changing this setting, refresh the page for changes to take effect.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
