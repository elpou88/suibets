import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Loader2, WalletIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  ConnectButton, 
  useCurrentAccount, 
  useConnectWallet,
  useWallets,
  useDisconnectWallet
} from '@mysten/dapp-kit';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { connectWallet } = useAuth();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  useEffect(() => {
    console.log('Available wallets:', wallets.map(w => w.name));
  }, [wallets]);

  useEffect(() => {
    if (currentAccount?.address) {
      console.log('Wallet connected:', currentAccount.address);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${currentAccount.address.substring(0, 8)}...${currentAccount.address.substring(currentAccount.address.length - 6)}`,
      });
      
      if (connectWallet) {
        connectWallet(currentAccount.address, 'sui')
          .then(() => onClose())
          .catch((err) => {
            console.error('Auth sync error:', err);
            onClose();
          });
      } else {
        onClose();
      }
    }
  }, [currentAccount?.address, connectWallet, onClose, toast]);

  const handleDirectConnect = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      const win = window as any;
      
      const slush = win.slush || win.suiWallet;
      if (slush) {
        console.log('Connecting via Slush/Sui Wallet...');
        if (slush.requestPermissions) await slush.requestPermissions();
        const accounts = await slush.getAccounts?.() || [];
        if (accounts?.[0]) {
          if (connectWallet) await connectWallet(accounts[0], 'slush');
          toast({ title: "Wallet Connected", description: `Connected: ${accounts[0].substring(0, 10)}...` });
          setConnecting(false);
          onClose();
          return;
        }
        const result = await slush.connect?.();
        const addr = result?.accounts?.[0]?.address || result?.address;
        if (addr) {
          if (connectWallet) await connectWallet(addr, 'slush');
          toast({ title: "Wallet Connected", description: `Connected: ${addr.substring(0, 10)}...` });
          setConnecting(false);
          onClose();
          return;
        }
      }

      const nightly = win.nightly?.sui;
      if (nightly) {
        console.log('Connecting via Nightly...');
        const result = await nightly.connect();
        const addr = result?.accounts?.[0]?.address || result?.address || result?.publicKey;
        if (addr) {
          if (connectWallet) await connectWallet(addr, 'nightly');
          toast({ title: "Wallet Connected", description: `Connected: ${addr.substring(0, 10)}...` });
          setConnecting(false);
          onClose();
          return;
        }
      }

      const suiet = win.suiet;
      if (suiet) {
        console.log('Connecting via Suiet...');
        const result = await suiet.connect?.();
        const addr = result?.accounts?.[0]?.address || result?.address;
        if (addr) {
          if (connectWallet) await connectWallet(addr, 'suiet');
          toast({ title: "Wallet Connected", description: `Connected: ${addr.substring(0, 10)}...` });
          setConnecting(false);
          onClose();
          return;
        }
      }

      if (wallets.length > 0) {
        console.log('Using dapp-kit to connect first available wallet:', wallets[0].name);
        connect({ wallet: wallets[0] });
        setConnecting(false);
        return;
      }

      setError("No wallet detected. Please install Slush, Nightly, or Suiet wallet extension and refresh the page.");
      setConnecting(false);
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err?.message || "Connection failed. Please try again.");
      setConnecting(false);
    }
  };

  const connectSpecificWallet = (wallet: any) => {
    setConnecting(true);
    setError(null);
    console.log('Connecting to wallet:', wallet.name);
    connect({ wallet }, {
      onSuccess: () => {
        console.log('Connected successfully');
        setConnecting(false);
      },
      onError: (err) => {
        console.error('Connection failed:', err);
        setError(err?.message || "Failed to connect");
        setConnecting(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your Sui wallet to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="w-full p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg border border-cyan-500/30">
            <h3 className="text-lg font-bold mb-3 text-center text-[#00FFFF]">
              Quick Connect
            </h3>
            <Button
              onClick={handleDirectConnect}
              disabled={connecting}
              className="w-full bg-[#00FFFF] hover:bg-[#00DDDD] text-black font-bold py-4 text-lg"
              data-testid="button-direct-connect"
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <WalletIcon className="mr-2 h-5 w-5" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>

          {wallets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 text-center">Or select a wallet:</p>
              {wallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  variant="outline"
                  className="w-full justify-start py-3"
                  onClick={() => connectSpecificWallet(wallet)}
                  disabled={connecting}
                  data-testid={`wallet-${wallet.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {wallet.icon && (
                    <img 
                      src={wallet.icon} 
                      alt={wallet.name} 
                      className="w-6 h-6 mr-3 rounded"
                    />
                  )}
                  {wallet.name}
                </Button>
              ))}
            </div>
          )}

          <div className="w-full p-3 bg-gray-800/50 rounded-lg border border-gray-600/30">
            <p className="text-sm text-gray-400 mb-2 text-center">Standard Connection:</p>
            <div className="flex justify-center [&_button]:!bg-cyan-600 [&_button]:!text-white [&_button]:!py-2 [&_button]:!px-4 [&_button]:!rounded [&_button]:!font-medium">
              <ConnectButton />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}

          <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-700">
            <p className="mb-2">
              Don't have a wallet? Install one of these:
            </p>
            <div className="flex justify-center gap-3">
              <a 
                href="https://slush.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Slush
              </a>
              <a 
                href="https://nightly.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Nightly
              </a>
              <a 
                href="https://suiet.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300"
              >
                Suiet
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
