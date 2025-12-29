import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { WALLET_TYPES } from "@/lib/utils";
import { ChevronRight, AlertCircle, Loader2, WalletIcon, Info } from "lucide-react";
import { useWalrusProtocol } from "@/hooks/useWalrusProtocol";
import { useToast } from "@/hooks/use-toast";
import { useWalletAdapter } from "@/components/wallet/WalletAdapter";
import { ConnectButton } from '@suiet/wallet-kit';
import { useWallet as useSuietWallet } from '@suiet/wallet-kit';
import { SuiDappKitConnect } from "@/components/wallet/SuiDappKitConnect";
import { SuietWalletConnect } from "@/components/wallet/SuietWalletConnect";
import { WalletDetector } from "@/components/wallet/WalletDetector";
import { MystenWalletConnect } from "@/components/wallet/MystenWalletConnect";
import { ConnectButton as MystenConnectButton, useWalletKit } from '@mysten/wallet-kit';
import { ConnectButton as DappKitConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';

// Define the props interface here instead of importing from types
interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { user, connectWallet } = useAuth();
  const { connect: connectAdapter, address, isConnected, error: walletError, updateConnectionState } = useWalletAdapter();
  const { connectToWurlusProtocol, checkRegistrationStatus, error: walrusError } = useWalrusProtocol();
  const { toast } = useToast();
  // Get Suiet wallet connection state
  const suietWallet = useSuietWallet();
  // Get Mysten wallet kit state
  const { currentAccount, isConnected: isMystenConnected } = useWalletKit();

  const modalRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'selecting' | 'connecting' | 'registering'>('selecting');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Update UI if wallet connection state changes
  useEffect(() => {
    if (isConnected && address) {
      console.log('Wallet detected as connected:', address);
      
      // Auto-close modal and notify user
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.substring(0, 8)}...${address.substring(address.length - 6)}`,
      });
      
      // Sync with auth context
      if (connectWallet) {
        connectWallet(address, 'sui');
      }
      
      setConnecting(false);
      setConnectionStep('selecting');
      onClose();
    }
  }, [isConnected, address, connectWallet, onClose, toast]);
  
  // Update UI if there's an error from the wallet adapter
  useEffect(() => {
    if (walletError) {
      setError(walletError);
      setConnecting(false);
      setConnectionStep('selecting');
    }
  }, [walletError]);
  
  // Handle Suiet Wallet connection
  useEffect(() => {
    if (suietWallet.connected && suietWallet.address) {
      console.log('Suiet wallet connected successfully:', suietWallet.address);
      
      toast({
        title: "Wallet Connected via Suiet",
        description: `Connected to ${suietWallet.address.substring(0, 8)}...${suietWallet.address.substring(suietWallet.address.length - 6)}`,
      });
      
      if (connectWallet) {
        connectWallet(suietWallet.address, 'sui')
          .then(() => console.log('Suiet wallet synced with auth context'))
          .catch((syncError) => console.error('Error syncing Suiet wallet with auth:', syncError));
      }
      
      setTimeout(() => onClose(), 1000);
    }
  }, [suietWallet.connected, suietWallet.address, connectWallet, onClose, toast]);

  // Get dapp-kit account (the newer, more reliable connection)
  const dappKitAccount = useCurrentAccount();
  
  // Handle dapp-kit connection (Nightly uses this)
  useEffect(() => {
    console.log('Dapp-kit account state:', { address: dappKitAccount?.address || 'none' });
    
    if (dappKitAccount?.address) {
      console.log('SUCCESS: Dapp-kit wallet connected with address:', dappKitAccount.address);
      
      try {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${dappKitAccount.address.substring(0, 8)}...${dappKitAccount.address.substring(dappKitAccount.address.length - 6)}`,
        });
        
        // Update adapter state
        console.log('Updating adapter state from dapp-kit...');
        updateConnectionState(dappKitAccount.address, 'sui');
        
        // Sync with auth context
        if (connectWallet) {
          console.log('Syncing dapp-kit with auth context...');
          connectWallet(dappKitAccount.address, 'sui')
            .then(() => {
              console.log('Dapp-kit auth sync complete');
              onClose();
            })
            .catch((err) => {
              console.error('Dapp-kit auth sync error:', err);
              onClose();
            });
        } else {
          onClose();
        }
      } catch (err) {
        console.error('Error in dapp-kit connection handler:', err);
      }
    }
  }, [dappKitAccount, connectWallet, updateConnectionState, onClose, toast]);

  // Handle Mysten Wallet Kit connection - LEGACY FALLBACK
  useEffect(() => {
    console.log('Mysten wallet state:', { isMystenConnected, currentAccount: currentAccount?.address || 'none' });
    
    // Only process if dapp-kit didn't already handle it
    if (dappKitAccount?.address) return;
    
    if (isMystenConnected && currentAccount?.address) {
      console.log('SUCCESS: Mysten wallet connected with address:', currentAccount.address);
      
      try {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${currentAccount.address.substring(0, 8)}...${currentAccount.address.substring(currentAccount.address.length - 6)}`,
        });
        
        // Update adapter state
        console.log('Updating adapter state...');
        updateConnectionState(currentAccount.address, 'sui');
        
        // Sync with auth context
        if (connectWallet) {
          console.log('Syncing with auth context...');
          connectWallet(currentAccount.address, 'sui')
            .then(() => {
              console.log('Auth sync complete');
              // Close modal only after sync
              onClose();
            })
            .catch((err) => {
              console.error('Auth sync error:', err);
              // Still close modal even if auth sync fails
              onClose();
            });
        } else {
          onClose();
        }
      } catch (err) {
        console.error('Error in Mysten connection handler:', err);
      }
    }
  }, [isMystenConnected, currentAccount, connectWallet, updateConnectionState, onClose, toast]);

  const handleConnectWallet = async (walletId: string) => {
    try {
      setSelectedWallet(walletId);
      setConnectionStep('connecting');
      setConnecting(true);
      setError(null);
      
      console.log('Initiating wallet connection for:', walletId);
      
      // Handle Nightly wallet specifically
      if (walletId === 'NIGHTLY') {
        try {
          const nightly = (window as any).nightly;
          const nightlySui = nightly?.sui;
          
          console.log('Nightly check:', { nightly: !!nightly, nightlySui: !!nightlySui });
          
          if (!nightlySui) {
            window.open('https://nightly.app/', '_blank');
            setConnecting(false);
            setConnectionStep('selecting');
            setError("Nightly wallet not detected. Please install the extension and refresh the page.");
            return;
          }

          console.log('Nightly wallet detected! Requesting connection...');
          
          // Simple direct connection with timeout
          let response: any;
          try {
            const connectFn = nightlySui.connect || nightlySui.features?.['standard:connect']?.connect;
            if (!connectFn) {
              throw new Error("Nightly wallet has no connect method");
            }
            
            response = await Promise.race([
              connectFn(),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timed out after 20s")), 20000))
            ]);
          } catch (connectErr: any) {
            console.error('Connection attempt failed:', connectErr);
            // Check for user rejection
            if (connectErr?.message?.toLowerCase().includes('reject') || 
                connectErr?.message?.toLowerCase().includes('cancel') ||
                connectErr?.message?.toLowerCase().includes('denied')) {
              setError("Connection rejected. Please approve in your wallet.");
            } else {
              setError(connectErr?.message || "Wallet connection failed");
            }
            setConnecting(false);
            setConnectionStep('selecting');
            return;
          }

          console.log('Nightly response:', response);
          const addr = response?.accounts?.[0]?.address || response?.address || response?.publicKey;
          
          if (addr) {
            console.log('Got wallet address:', addr);
            // Update state and close
            setConnecting(false);
            setConnectionStep('selecting');
            onClose();
            
            // Sync contexts
            updateConnectionState(addr, 'nightly').catch(e => console.error('Adapter sync error:', e));
            if (connectWallet) {
              connectWallet(addr, 'nightly').catch(e => console.error('Auth sync error:', e));
            }
            
            toast({ title: "Wallet Connected", description: "Nightly wallet ready" });
            return;
          } else {
            console.error('No address in response:', response);
            setError("Connected but no address received. Please try again.");
            setConnecting(false);
            setConnectionStep('selecting');
            return;
          }
        } catch (err: any) {
          console.error('Nightly connection error:', err);
          setError(err?.message || "Connection failed. Please try again.");
          setConnecting(false);
          setConnectionStep('selecting');
          return;
        }
      }
      
      // Generic adapter for other wallets
      const success = await connectAdapter();
      if (success) onClose();
      
      // Fail-safe timeout
      setTimeout(() => {
        setConnecting(prev => {
          if (prev) {
            setConnectionStep('selecting');
            setError("Timed out");
            return false;
          }
          return false;
        });
      }, 15000);
      
    } catch (err: any) {
      setError("Connection failed");
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
            {/* PRIMARY: Dapp-Kit Connect Button - Works best with Nightly */}
            <div className="w-full p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg border border-cyan-500/30">
              <h3 className="text-lg font-bold mb-3 text-center text-[#00FFFF]">
                Click to Connect Your Wallet
              </h3>
              <div className="flex justify-center [&_button]:!bg-[#00FFFF] [&_button]:!text-black [&_button]:!font-bold [&_button]:!py-3 [&_button]:!px-6 [&_button]:!rounded-lg [&_button]:!text-lg">
                <DappKitConnectButton />
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Detects all Sui wallets including Nightly, Sui Wallet, Suiet, etc.
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </p>
              </div>
            )}
            
            {/* Wallet detector for debugging */}
            <WalletDetector />
            
            <div className="w-full text-center text-sm text-gray-400 my-2">- or try alternative connection methods -</div>
            
            <div className="w-full rounded overflow-hidden mb-2">
              <h3 className="text-sm font-medium mb-2 flex items-center text-gray-300">
                <Info className="h-4 w-4 mr-2" />
                SuiDappKit Connect
              </h3>
              <SuiDappKitConnect 
                onConnect={(address) => {
                  if (connectWallet) {
                    console.log('SuiDappKitConnect onConnect called with address:', address);
                    connectWallet(address, 'sui')
                      .then(() => {
                        toast({
                          title: "Wallet Connected",
                          description: `Connected to ${address.substring(0, 8)}...${address.substring(address.length - 6)}`,
                        });
                        onClose();
                      })
                      .catch((error) => {
                        console.error('Error syncing wallet with auth:', error);
                      });
                  }
                }}
              />
            </div>
            
            <div className="w-full rounded overflow-hidden mb-4 mt-3">
              <h3 className="text-sm font-medium mb-2 flex items-center text-gray-300">
                <Info className="h-4 w-4 mr-2" />
                Suiet Wallet
              </h3>
              <SuietWalletConnect 
                onConnect={(address) => {
                  if (connectWallet) {
                    connectWallet(address, 'sui')
                      .then(() => {
                        toast({
                          title: "Wallet Connected",
                          description: `Connected to ${address.substring(0, 8)}...${address.substring(address.length - 6)}`,
                        });
                        onClose();
                      })
                      .catch((error) => {
                        console.error('Error syncing wallet with auth:', error);
                      });
                  }
                }}
              />
            </div>
            
            <div className="w-full text-center text-sm text-gray-400 my-2">- or select wallet manually -</div>
            
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
                {connectionStep === 'connecting' ? 'Connecting Wallet' : 'Registering with Walrus Protocol'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {connectionStep === 'connecting' 
                  ? 'Please approve the connection in your wallet...' 
                  : 'Registering your wallet with the Walrus protocol...'}
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
          
          <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
            <p className="mb-2 text-gray-600 dark:text-gray-400 font-medium">Wallet Connection Options:</p>
            
            <div className="flex flex-col justify-center items-center mb-4">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
                <span className="font-semibold">Note:</span> To use a real Sui wallet, you need to have a wallet extension like Sui Wallet, Ethos Wallet, or Suiet installed in your browser.
              </p>
              
              <div className="flex items-center my-2">
                <span className="text-green-500 mr-2">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Real wallets are always prioritized by default</span>
              </div>
              
              <div className="flex justify-between items-center w-full mt-2">
                <span className="text-sm text-green-600 dark:text-green-400">
                  ✅ Using real Sui wallets only
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
              <div className="flex items-center text-blue-700 dark:text-blue-300 font-medium mb-1">
                <WalletIcon className="h-4 w-4 mr-1" />
                <span>Real Wallet Extensions</span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">
                For real wallet support, install one of these browser extensions:
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1">
                <a 
                  href="https://nightly.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 dark:text-blue-300 hover:underline font-bold"
                >
                  • Nightly Wallet (Recommended)
                </a>
                <a 
                  href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 dark:text-blue-300 hover:underline"
                >
                  • Sui Wallet
                </a>
                <a 
                  href="https://chrome.google.com/webstore/detail/ethos-sui-wallet/mcbigmjiafegjnnogedioegffbooigli" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 dark:text-blue-300 hover:underline"
                >
                  • Ethos Wallet
                </a>
                <a 
                  href="https://chrome.google.com/webstore/detail/suiet-sui-wallet/khpkpbbcccdmmclmpigdgddabeilkdpd" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 dark:text-blue-300 hover:underline"
                >
                  • Suiet Wallet
                </a>
                <a 
                  href="https://chrome.google.com/webstore/detail/martian-wallet-aptos-sui/efbglgofoippbgcjepnhiblaibcnclgk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 dark:text-blue-300 hover:underline"
                >
                  • Martian Wallet
                </a>
              </div>
            </div>

            <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-100 dark:border-yellow-800">
              <div className="flex items-center text-yellow-700 dark:text-yellow-300 font-medium mb-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Troubleshooting Tips</span>
              </div>
              <ul className="text-[10px] text-yellow-700 dark:text-yellow-400 list-disc pl-4 space-y-1">
                <li>Make sure your wallet extension is installed and enabled</li>
                <li>Unlock your wallet before connecting</li>
                <li>If connecting fails, try refreshing the page</li>
                <li>Check that your wallet is on the Sui network</li>
                <li>Allow pop-ups from this site in your browser settings</li>
              </ul>
            </div>
            
            <div className="mt-3 text-[10px] text-center text-gray-500">
              Need help? Check out the <a href="https://docs.sui.io/guides/wallet-browser" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sui Wallet documentation</a> for detailed setup instructions.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
