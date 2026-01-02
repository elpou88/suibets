import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Loader2, WalletIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWalletAdapter } from "@/components/wallet/WalletAdapter";
import { 
  useCurrentAccount, 
  useConnectWallet,
  useWallets,
} from '@mysten/dapp-kit';
import { getWallets } from '@wallet-standard/app';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletInfo {
  name: string;
  icon?: string;
  wallet: any;
  source: 'standard' | 'dappkit' | 'direct';
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { connectWallet } = useAuth();
  const { updateConnectionState } = useWalletAdapter();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allWallets, setAllWallets] = useState<WalletInfo[]>([]);
  
  // Ref to prevent duplicate processing of the same address
  const processedAddressRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  const currentAccount = useCurrentAccount();
  const dappkitWallets = useWallets();
  const { mutate: connect } = useConnectWallet();

  const detectAllWallets = useCallback(() => {
    const walletMap = new Map<string, WalletInfo>();
    
    try {
      const walletsApi = getWallets();
      const registeredWallets = walletsApi.get();
      console.log('Wallet Standard API found:', registeredWallets.length, 'wallets');
      
      registeredWallets.forEach((wallet: any) => {
        const hasSuiFeature = wallet.features?.['sui:signAndExecuteTransactionBlock'] || 
                              wallet.features?.['sui:signTransactionBlock'] ||
                              wallet.features?.['standard:connect'] ||
                              wallet.chains?.some((c: string) => c.includes('sui'));
        
        if (hasSuiFeature || wallet.name?.toLowerCase().includes('sui') || 
            ['slush', 'nightly', 'suiet', 'ethos', 'martian'].some(n => 
              wallet.name?.toLowerCase().includes(n))) {
          console.log('Found Sui wallet:', wallet.name, wallet.icon ? '(has icon)' : '');
          walletMap.set(wallet.name, {
            name: wallet.name,
            icon: wallet.icon,
            wallet: wallet,
            source: 'standard'
          });
        }
      });
    } catch (e) {
      console.log('Wallet Standard API error:', e);
    }
    
    dappkitWallets.forEach((wallet) => {
      if (!walletMap.has(wallet.name)) {
        console.log('Adding dapp-kit wallet:', wallet.name);
        walletMap.set(wallet.name, {
          name: wallet.name,
          icon: wallet.icon,
          wallet: wallet,
          source: 'dappkit'
        });
      }
    });
    
    const win = window as any;
    const directWallets = [
      { key: 'slush', check: () => win.slush || win.suiWallet, name: 'Slush' },
      { key: 'nightly', check: () => win.nightly?.sui, name: 'Nightly' },
      { key: 'suiet', check: () => win.suiet, name: 'Suiet' },
      { key: 'ethos', check: () => win.ethos, name: 'Ethos Wallet' },
      { key: 'martian', check: () => win.martian, name: 'Martian Sui Wallet' },
    ];
    
    directWallets.forEach(({ key, check, name }) => {
      const walletObj = check();
      if (walletObj && !walletMap.has(name)) {
        console.log('Found direct window wallet:', name);
        walletMap.set(name, {
          name: name,
          wallet: { directKey: key, obj: walletObj },
          source: 'direct'
        });
      }
    });
    
    const walletList = Array.from(walletMap.values());
    console.log('Total wallets found:', walletList.length, walletList.map(w => w.name));
    setAllWallets(walletList);
    return walletList;
  }, [dappkitWallets]);

  useEffect(() => {
    if (!isOpen) {
      // Reset processing state when modal closes so reconnection works
      isProcessingRef.current = false;
      return;
    }
    
    // Reset processed address when modal opens to allow reconnection
    processedAddressRef.current = null;
    
    detectAllWallets();
    
    const timers = [100, 500, 1000, 2000].map(delay => 
      setTimeout(detectAllWallets, delay)
    );
    
    try {
      const walletsApi = getWallets();
      const unsubscribe = walletsApi.on('register', () => {
        console.log('New wallet registered');
        detectAllWallets();
      });
      return () => {
        timers.forEach(clearTimeout);
        unsubscribe();
      };
    } catch (e) {
      return () => timers.forEach(clearTimeout);
    }
  }, [isOpen, detectAllWallets]);

  // Single effect to handle dapp-kit connection state changes
  useEffect(() => {
    const address = currentAccount?.address;
    
    // Skip if no address, already processed this address, or currently processing
    if (!address || processedAddressRef.current === address || isProcessingRef.current) {
      return;
    }
    
    // Mark as processing to prevent race conditions
    isProcessingRef.current = true;
    processedAddressRef.current = address;
    
    console.log('Dapp-kit connected, processing address:', address);
    
    // Show toast once
    toast({
      title: "Wallet Connected",
      description: `Connected: ${address.substring(0, 8)}...${address.slice(-6)}`,
    });
    
    // Update auth context (async but don't block)
    if (connectWallet) {
      connectWallet(address, 'sui')
        .catch((err) => console.error('Auth sync error:', err))
        .finally(() => {
          isProcessingRef.current = false;
        });
    } else {
      isProcessingRef.current = false;
    }
    
    // Reset UI state and close modal
    setConnecting(false);
    setConnectingWallet(null);
    onClose();
  }, [currentAccount?.address, connectWallet, onClose, toast]);

  const connectToWallet = async (walletInfo: WalletInfo) => {
    setConnecting(true);
    setConnectingWallet(walletInfo.name);
    setError(null);
    
    try {
      if (walletInfo.source === 'dappkit' || walletInfo.source === 'standard') {
        const dappkitWallet = dappkitWallets.find(w => w.name === walletInfo.name);
        
        if (dappkitWallet) {
          console.log('Connecting via dapp-kit:', walletInfo.name);
          connect({ wallet: dappkitWallet }, {
            onSuccess: () => {
              console.log('Dapp-kit connection success');
            },
            onError: (err) => {
              console.error('Dapp-kit connection failed:', err);
              tryDirectConnection(walletInfo);
            }
          });
          return;
        }
        
        if (walletInfo.wallet?.features?.['standard:connect']) {
          console.log('Connecting via wallet standard:', walletInfo.name);
          const result = await walletInfo.wallet.features['standard:connect'].connect();
          const address = result?.accounts?.[0]?.address;
          if (address) {
            await finalizeConnection(address, walletInfo.name);
            return;
          }
        }
      }
      
      await tryDirectConnection(walletInfo);
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err?.message || "Connection failed. Please try again.");
      setConnecting(false);
      setConnectingWallet(null);
    }
  };
  
  const tryDirectConnection = async (walletInfo: WalletInfo) => {
    const win = window as any;
    let address: string | null = null;
    const name = walletInfo.name.toLowerCase();
    
    try {
      if (name.includes('slush') || name === 'sui wallet') {
        const wallet = win.slush || win.suiWallet;
        if (wallet) {
          try { await wallet.requestPermissions?.(); } catch {}
          const accounts = await wallet.getAccounts?.() || [];
          address = accounts[0] || (await wallet.connect?.())?.accounts?.[0]?.address;
        }
      } else if (name.includes('nightly')) {
        const wallet = win.nightly?.sui;
        if (wallet) {
          const result = await wallet.connect();
          address = result?.accounts?.[0]?.address || result?.publicKey;
        }
      } else if (name.includes('suiet')) {
        const wallet = win.suiet;
        if (wallet) {
          try { 
            if (!await wallet.hasPermissions?.()) await wallet.requestPermissions?.(); 
          } catch {}
          const result = await wallet.connect?.();
          address = result?.accounts?.[0]?.address || (await wallet.getAccounts?.())?.[0];
        }
      } else if (name.includes('ethos')) {
        const wallet = win.ethos;
        if (wallet) {
          const result = await wallet.connect?.();
          address = result?.accounts?.[0]?.address;
        }
      } else if (name.includes('martian')) {
        const wallet = win.martian;
        if (wallet) {
          const result = await wallet.connect?.();
          address = result?.accounts?.[0]?.address;
        }
      }
      
      if (address) {
        await finalizeConnection(address, walletInfo.name);
      } else {
        throw new Error(`Could not connect to ${walletInfo.name}`);
      }
    } catch (err: any) {
      console.error('Direct connection failed:', err);
      setError(err?.message || `Failed to connect to ${walletInfo.name}`);
      setConnecting(false);
      setConnectingWallet(null);
    }
  };
  
  const finalizeConnection = async (address: string, walletName: string) => {
    // Skip if already processed this address
    if (processedAddressRef.current === address) {
      console.log('Address already processed:', address);
      setConnecting(false);
      setConnectingWallet(null);
      onClose();
      return;
    }
    
    console.log('Finalizing connection for:', address, 'via', walletName);
    
    // Mark as processed
    processedAddressRef.current = address;
    isProcessingRef.current = true;
    
    // Update WalletAdapter state
    try {
      await updateConnectionState(address, walletName.toLowerCase());
    } catch (e) {
      console.error('WalletAdapter update error:', e);
    }
    
    // Update AuthContext (syncs with backend)
    if (connectWallet) {
      try {
        await connectWallet(address, walletName.toLowerCase());
      } catch (e) {
        console.error('AuthContext update error:', e);
      }
    }
    
    isProcessingRef.current = false;
    
    // Show single toast
    toast({
      title: "Wallet Connected",
      description: `Connected: ${address.substring(0, 8)}...${address.slice(-6)}`,
    });
    
    setConnecting(false);
    setConnectingWallet(null);
    onClose();
  };

  const handleQuickConnect = async () => {
    const wallets = detectAllWallets();
    
    const priorityOrder = ['slush', 'sui wallet', 'nightly', 'suiet'];
    const priorityWallet = wallets.find(w => 
      priorityOrder.some(p => w.name.toLowerCase().includes(p))
    );
    
    if (priorityWallet) {
      await connectToWallet(priorityWallet);
    } else if (wallets.length > 0) {
      await connectToWallet(wallets[0]);
    } else {
      setError("No wallet found. Please install Slush, Nightly, or Suiet wallet extension.");
    }
  };

  const displayWallets = allWallets.filter(w => w.name !== 'Stashed');

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
              data-testid="button-quick-connect"
            >
              {connecting && !connectingWallet ? (
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

          {displayWallets.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 text-center">
                Detected wallets ({displayWallets.length}):
              </p>
              {displayWallets.map((walletInfo) => (
                <Button
                  key={walletInfo.name}
                  variant="outline"
                  className="w-full justify-start py-3 hover:bg-cyan-900/20 hover:border-cyan-500/50"
                  onClick={() => connectToWallet(walletInfo)}
                  disabled={connecting}
                  data-testid={`wallet-${walletInfo.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {connectingWallet === walletInfo.name ? (
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  ) : walletInfo.icon ? (
                    <img 
                      src={walletInfo.icon} 
                      alt={walletInfo.name} 
                      className="w-6 h-6 mr-3 rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <WalletIcon className="w-6 h-6 mr-3" />
                  )}
                  <span className="text-white">{walletInfo.name}</span>
                  <span className="ml-auto text-xs text-green-400">Detected</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-amber-400 text-sm mb-3">
                Checking for wallet extensions...
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={detectAllWallets}
                className="text-cyan-400 border-cyan-500/50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Again
              </Button>
            </div>
          )}

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
              Don't have a wallet? Install one:
            </p>
            <div className="flex justify-center gap-3">
              <a href="https://slush.dev" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Slush</a>
              <a href="https://nightly.app" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Nightly</a>
              <a href="https://suiet.app" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Suiet</a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
