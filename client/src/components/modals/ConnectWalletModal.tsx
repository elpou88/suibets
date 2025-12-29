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

// Define the props interface here instead of importing from types
interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const { user, connectWallet } = useAuth();
  const { connect: connectAdapter, address, isConnected, error: walletError } = useWalletAdapter();
  const { connectToWurlusProtocol, checkRegistrationStatus, error: walrusError } = useWalrusProtocol();
  const { toast } = useToast();
  // Get Suiet wallet connection state
  const suietWallet = useSuietWallet();

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
  
  // Handle Suiet Wallet connection
  useEffect(() => {
    if (suietWallet.connected && suietWallet.address) {
      console.log('Suiet wallet connected successfully:', suietWallet.address);
      
      toast({
        title: "Wallet Connected via Suiet",
        description: `Connected to ${suietWallet.address.substring(0, 8)}...${suietWallet.address.substring(suietWallet.address.length - 6)}`,
      });
      
      if (connectWallet) {
        // Sync the wallet connection with auth context
        connectWallet(suietWallet.address, 'sui')
          .then(() => {
            console.log('Suiet wallet synced with auth context');
          })
          .catch((syncError) => {
            console.error('Error syncing Suiet wallet with auth:', syncError);
          });
      }
      
      // Close the modal after a short delay to show the success state
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  }, [suietWallet.connected, suietWallet.address, connectWallet, onClose, toast]);

  const handleConnectWallet = async (walletId: string) => {
    try {
      setSelectedWallet(walletId);
      setConnectionStep('connecting');
      setConnecting(true);
      setError(null);
      
      console.log('Initiating wallet connection for:', walletId);
      
      // Try wallet-specific connection first based on user's selection
      let connectionSuccessful = false;
      
      // Handle Nightly wallet specifically when user clicks it
      if (walletId === 'NIGHTLY') {
        console.log('User selected Nightly wallet - trying direct connection');
        try {
          // @ts-ignore - Check multiple ways Nightly might inject itself
          const nightlyProvider = (window as any).nightly;
          const nightlySui = nightlyProvider?.sui;
          
          console.log('Nightly detection:', { 
            hasNightly: !!nightlyProvider, 
            hasSui: !!nightlySui,
            nightlyKeys: nightlyProvider ? Object.keys(nightlyProvider) : []
          });
          
          if (!nightlyProvider) {
            // Open Nightly install page
            window.open('https://nightly.app/', '_blank');
            setError("Nightly wallet not detected. Please install it and refresh the page.");
            setConnecting(false);
            setConnectionStep('selecting');
            return;
          }
          
          if (nightlySui) {
            console.log('Nightly Sui adapter found, connecting...');
            // Use the Sui-specific connect
            // @ts-ignore
            const features = nightlySui.features || {};
            console.log('Nightly Sui features:', Object.keys(features));
            
            // Try standard:connect feature first
            if (features['standard:connect']) {
              // @ts-ignore
              const result = await features['standard:connect'].connect();
              console.log('Nightly standard:connect result:', result);
              if (result?.accounts?.[0]?.address) {
                const walletAddress = result.accounts[0].address;
                if (connectWallet) {
                  await connectWallet(walletAddress, 'nightly');
                }
                toast({ title: "Wallet Connected", description: "Connected to Nightly Wallet" });
                setConnecting(false);
                onClose();
                return;
              }
            }
            
            // Try direct connect method
            // @ts-ignore
            if (typeof nightlySui.connect === 'function') {
              // @ts-ignore
              const response = await nightlySui.connect();
              console.log('Nightly sui.connect response:', response);
              
              const walletAddress = response?.accounts?.[0]?.address || 
                                    response?.address || 
                                    response?.publicKey;
              
              if (walletAddress) {
                console.log('Connected to Nightly wallet:', walletAddress);
                if (connectWallet) {
                  await connectWallet(walletAddress, 'nightly');
                }
                toast({ title: "Wallet Connected", description: "Connected to Nightly Wallet" });
                setConnecting(false);
                onClose();
                return;
              }
            }
          }
          
          // Fallback: Try using wallet standard
          console.log('Trying wallet standard detection for Nightly...');
          const { getWallets } = await import('@wallet-standard/core');
          const wallets = getWallets().get();
          const nightlyWallet = wallets.find((w: any) => 
            w.name?.toLowerCase().includes('nightly')
          );
          
          if (nightlyWallet) {
            console.log('Found Nightly via wallet standard:', nightlyWallet.name);
            // @ts-ignore
            const connectFeature = nightlyWallet.features?.['standard:connect'];
            if (connectFeature) {
              // @ts-ignore
              const result = await connectFeature.connect();
              if (result?.accounts?.[0]?.address) {
                const walletAddress = result.accounts[0].address;
                if (connectWallet) {
                  await connectWallet(walletAddress, 'nightly');
                }
                toast({ title: "Wallet Connected", description: "Connected to Nightly Wallet" });
                setConnecting(false);
                onClose();
                return;
              }
            }
          }
          
          setError("Could not connect to Nightly. Please make sure it's unlocked and try again.");
          setConnecting(false);
          setConnectionStep('selecting');
          return;
          
        } catch (nightlyError: any) {
          console.error('Nightly wallet connection error:', nightlyError);
          setError(nightlyError?.message || "Failed to connect to Nightly wallet. Please try again.");
          setConnecting(false);
          setConnectionStep('selecting');
          return;
        }
      }
      
      // For other wallets, use the generic adapter
      console.log('Using generic wallet adapter for:', walletId);
      connectionSuccessful = await connectAdapter();
      
      console.log('connectAdapter() completed, success:', connectionSuccessful);
      
      // If still no address, wait for user interaction
      if (!address && !isConnected) {
        console.log('Connection in progress - waiting for wallet interaction...');
        setTimeout(() => {
          if (!address && !isConnected) {
            setTimeout(() => {
              if (!address && !isConnected) {
                setError("Wallet connection timed out. Please try again and ensure you approve the connection in your wallet.");
                setConnecting(false);
                setConnectionStep('selecting');
              }
            }, 5000);
          }
        }, 2000);
      }
      
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err?.message || walrusError || "Failed to connect wallet. Please try again.");
      toast({
        title: "Connection Failed",
        description: err?.message || walrusError || "Failed to connect wallet. Please try again.",
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
            {/* Wallet detector component */}
            <WalletDetector />
            
            {/* Wallet connection components */}
            <div className="w-full rounded overflow-hidden mt-4 mb-4">
              <h3 className="text-sm font-medium mb-2 flex items-center text-[#00FFFF]">
                <Info className="h-4 w-4 mr-2" />
                Connect with Mysten Wallet Kit
              </h3>
              <MystenWalletConnect 
                onConnect={(address) => {
                  if (connectWallet) {
                    console.log('MystenWalletConnect onConnect called with address:', address);
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
            
            <div className="w-full text-center text-sm text-gray-400 my-2">- or use alternative connection methods -</div>
            
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
