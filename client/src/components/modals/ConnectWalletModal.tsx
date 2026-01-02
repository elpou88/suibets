import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Loader2, WalletIcon, RefreshCw } from "lucide-react";
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

interface DetectedWallet {
  name: string;
  key: string;
  icon?: string;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { connectWallet } = useAuth();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]);
  const [checkCount, setCheckCount] = useState(0);

  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  const detectInstalledWallets = useCallback(() => {
    const win = window as any;
    const detected: DetectedWallet[] = [];
    
    if (win.slush || win.suiWallet) {
      detected.push({ name: 'Slush', key: 'slush', icon: 'https://slush.dev/favicon.ico' });
    }
    if (win.nightly?.sui) {
      detected.push({ name: 'Nightly', key: 'nightly', icon: 'https://nightly.app/favicon.ico' });
    }
    if (win.suiet) {
      detected.push({ name: 'Suiet', key: 'suiet', icon: 'https://suiet.app/favicon.ico' });
    }
    if (win.ethos) {
      detected.push({ name: 'Ethos', key: 'ethos' });
    }
    if (win.martian) {
      detected.push({ name: 'Martian', key: 'martian' });
    }
    
    console.log('Direct wallet detection:', detected.map(w => w.name));
    setDetectedWallets(detected);
    return detected;
  }, []);

  useEffect(() => {
    if (isOpen) {
      detectInstalledWallets();
      
      const timer1 = setTimeout(() => {
        detectInstalledWallets();
        setCheckCount(c => c + 1);
      }, 500);
      
      const timer2 = setTimeout(() => {
        detectInstalledWallets();
        setCheckCount(c => c + 1);
      }, 1500);
      
      const timer3 = setTimeout(() => {
        detectInstalledWallets();
        setCheckCount(c => c + 1);
      }, 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, detectInstalledWallets]);

  useEffect(() => {
    console.log('Dapp-kit wallets:', wallets.map(w => w.name));
  }, [wallets]);

  useEffect(() => {
    if (currentAccount?.address) {
      console.log('Wallet connected via dapp-kit:', currentAccount.address);
      
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

  const connectDirectWallet = async (walletKey: string) => {
    setConnecting(true);
    setError(null);
    
    try {
      const win = window as any;
      let address: string | null = null;
      
      if (walletKey === 'slush') {
        const slush = win.slush || win.suiWallet;
        if (slush) {
          console.log('Connecting via Slush...');
          try {
            if (slush.requestPermissions) await slush.requestPermissions();
          } catch (e) { console.log('Permission request:', e); }
          
          try {
            const accounts = await slush.getAccounts?.();
            if (accounts?.[0]) {
              address = accounts[0];
            }
          } catch (e) { console.log('getAccounts:', e); }
          
          if (!address) {
            const result = await slush.connect?.();
            address = result?.accounts?.[0]?.address || result?.address || result?.accounts?.[0];
          }
        }
      }
      
      if (walletKey === 'nightly') {
        const nightly = win.nightly?.sui;
        if (nightly) {
          console.log('Connecting via Nightly...');
          const result = await nightly.connect();
          address = result?.accounts?.[0]?.address || result?.address || result?.publicKey;
        }
      }
      
      if (walletKey === 'suiet') {
        const suiet = win.suiet;
        if (suiet) {
          console.log('Connecting via Suiet...');
          try {
            if (suiet.hasPermissions && !await suiet.hasPermissions()) {
              await suiet.requestPermissions?.();
            }
          } catch (e) { console.log('Suiet permissions:', e); }
          
          const result = await suiet.connect?.();
          address = result?.accounts?.[0]?.address || result?.address || result?.accounts?.[0];
          
          if (!address) {
            const accounts = await suiet.getAccounts?.();
            address = accounts?.[0];
          }
        }
      }
      
      if (walletKey === 'ethos') {
        const ethos = win.ethos;
        if (ethos) {
          console.log('Connecting via Ethos...');
          const result = await ethos.connect?.();
          address = result?.accounts?.[0]?.address || result?.address;
        }
      }
      
      if (walletKey === 'martian') {
        const martian = win.martian;
        if (martian) {
          console.log('Connecting via Martian...');
          const result = await martian.connect?.();
          address = result?.accounts?.[0]?.address || result?.address;
        }
      }
      
      if (address) {
        console.log('Connected with address:', address);
        if (connectWallet) await connectWallet(address, walletKey);
        toast({ 
          title: "Wallet Connected", 
          description: `Connected: ${address.substring(0, 10)}...${address.substring(address.length - 6)}` 
        });
        setConnecting(false);
        onClose();
        return;
      }
      
      setError(`Could not connect to ${walletKey}. Please try again or use a different wallet.`);
      setConnecting(false);
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err?.message || "Connection failed. Please try again.");
      setConnecting(false);
    }
  };

  const handleQuickConnect = async () => {
    setConnecting(true);
    setError(null);
    
    const freshDetected = detectInstalledWallets();
    
    if (freshDetected.length > 0) {
      await connectDirectWallet(freshDetected[0].key);
      return;
    }
    
    if (wallets.length > 0) {
      console.log('Using dapp-kit to connect:', wallets[0].name);
      connect({ wallet: wallets[0] }, {
        onSuccess: () => setConnecting(false),
        onError: (err) => {
          setError(err?.message || "Connection failed");
          setConnecting(false);
        }
      });
      return;
    }
    
    setError("No wallet detected. Please install Slush, Nightly, or Suiet wallet extension and refresh the page.");
    setConnecting(false);
  };

  const handleRefresh = () => {
    detectInstalledWallets();
    setError(null);
    toast({ title: "Checking for wallets...", description: "Looking for installed wallet extensions" });
  };

  const allWallets = [
    ...detectedWallets,
    ...wallets.filter(w => !detectedWallets.some(d => 
      d.name.toLowerCase().includes(w.name.toLowerCase()) || 
      w.name.toLowerCase().includes(d.name.toLowerCase())
    )).map(w => ({ name: w.name, key: 'dappkit-' + w.name, icon: w.icon, dappkitWallet: w }))
  ];

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
              onClick={handleQuickConnect}
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

          {allWallets.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 text-center">Detected wallets ({allWallets.length}):</p>
              {allWallets.map((wallet: any) => (
                <Button
                  key={wallet.key}
                  variant="outline"
                  className="w-full justify-start py-3 hover:bg-cyan-900/20 hover:border-cyan-500/50"
                  onClick={() => {
                    if (wallet.dappkitWallet) {
                      setConnecting(true);
                      connect({ wallet: wallet.dappkitWallet }, {
                        onSuccess: () => setConnecting(false),
                        onError: (err) => {
                          setError(err?.message || "Connection failed");
                          setConnecting(false);
                        }
                      });
                    } else {
                      connectDirectWallet(wallet.key);
                    }
                  }}
                  disabled={connecting}
                  data-testid={`wallet-${wallet.key}`}
                >
                  {wallet.icon && (
                    <img 
                      src={wallet.icon} 
                      alt={wallet.name} 
                      className="w-6 h-6 mr-3 rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <span className="text-white">{wallet.name}</span>
                  <span className="ml-auto text-xs text-green-400">Detected</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-amber-400 text-sm mb-3">
                No wallets detected yet. Extensions may need time to load.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="text-cyan-400 border-cyan-500/50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Again
              </Button>
            </div>
          )}

          <div className="w-full p-3 bg-gray-800/50 rounded-lg border border-gray-600/30">
            <p className="text-sm text-gray-400 mb-2 text-center">Standard Connection (dapp-kit):</p>
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
