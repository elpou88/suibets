import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallets } from '@mysten/dapp-kit';

export interface WalletDetectionResult {
  name: string;
  detected: boolean;
  available: boolean;
  logo?: string; 
}

export function WalletDetector() {
  const [wallets, setWallets] = useState<WalletDetectionResult[]>([]);
  const [detectionComplete, setDetectionComplete] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const dappKitWallets = useWallets();

  const detectWallets = async () => {
    setDetectionComplete(false);
    const results: WalletDetectionResult[] = [];
    
    const win = window as any;
    
    const hasSlush = typeof win.slush !== 'undefined' || typeof win.suiWallet !== 'undefined';
    results.push({ 
      name: 'Slush Wallet', 
      detected: hasSlush,
      available: hasSlush
    });
    
    const hasNightly = typeof win.nightly?.sui !== 'undefined';
    results.push({ 
      name: 'Nightly', 
      detected: hasNightly,
      available: hasNightly
    });
    
    const hasEthosWallet = typeof win.ethos !== 'undefined';
    results.push({ 
      name: 'Ethos Wallet', 
      detected: hasEthosWallet,
      available: hasEthosWallet
    });
    
    const hasSuietWallet = typeof win.suiet !== 'undefined';
    results.push({ 
      name: 'Suiet Wallet', 
      detected: hasSuietWallet,
      available: hasSuietWallet
    });
    
    const hasMartianWallet = typeof win.martian !== 'undefined';
    results.push({ 
      name: 'Martian Wallet', 
      detected: hasMartianWallet,
      available: hasMartianWallet
    });
    
    const hasDappKitWallets = dappKitWallets && dappKitWallets.length > 0;
    results.push({ 
      name: `DappKit Wallets (${dappKitWallets?.length || 0})`, 
      detected: hasDappKitWallets,
      available: hasDappKitWallets 
    });
    
    console.log('Wallet detection results:', results);
    console.log('DappKit detected wallets:', dappKitWallets?.map(w => w.name));
    setWallets(results);
    setDetectionComplete(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      detectWallets();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [dappKitWallets, retryCount]);
  
  const hasAnyWallet = wallets.some(w => w.detected);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  return (
    <div className="wallet-detector mt-4 p-3 bg-background/5 rounded-md text-sm">
      <h4 className="font-medium mb-2 flex items-center justify-between">
        <span className="flex items-center">
          {detectionComplete ? (
            hasAnyWallet ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Wallet Extensions Detected
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                No Wallet Extensions Detected
              </>
            )
          ) : (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin mr-2" />
              Detecting wallet extensions...
            </>
          )}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRetry}
          className="h-6 px-2"
          data-testid="button-retry-detection"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </h4>
      
      {detectionComplete && (
        <div className="grid gap-1 mt-2">
          {wallets.map(wallet => (
            <div key={wallet.name} className="flex items-center text-xs py-1">
              {wallet.detected ? (
                <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500 mr-2" />
              )}
              <span className={wallet.detected ? 'text-white' : 'text-gray-500'}>
                {wallet.name}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {!hasAnyWallet && detectionComplete && (
        <div className="mt-2 text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded">
          <p className="font-medium">Troubleshooting tips:</p>
          <ul className="mt-1 list-disc pl-4 space-y-1">
            <li>Make sure your wallet extension is enabled</li>
            <li>Try disabling Brave Shields or ad-blockers</li>
            <li>Refresh the page after installing the wallet</li>
            <li>Click the retry button above after a few seconds</li>
          </ul>
        </div>
      )}
    </div>
  );
}
