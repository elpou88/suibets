import { useState, useCallback } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useToast } from '@/hooks/use-toast';

// Contract addresses - update after deployment
const BETTING_PACKAGE_ID = import.meta.env.VITE_BETTING_PACKAGE_ID || '0xf8209567df9e80789ec7036f747d6386a8935b50f065e955a715e364f4f893aa';
const BETTING_PLATFORM_ID = import.meta.env.VITE_BETTING_PLATFORM_ID || '0x5fe75eab8aef1c209e0d2b8d53cd601d4efaf22511e82d8504b0f7f6c754df89';
const CLOCK_OBJECT_ID = '0x6';

// SBETS token type from mainnet
const SBETS_TOKEN_TYPE = '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS';

export interface OnChainBetParams {
  eventId: string;
  marketId: string;
  prediction: string;
  betAmount: number; // In SUI or SBETS (will be converted to smallest units)
  odds: number;
  walrusBlobId?: string;
  coinType: 'SUI' | 'SBETS';
  sbetsCoinObjectId?: string; // Required for SBETS bets
}

export interface OnChainBetResult {
  success: boolean;
  txDigest?: string;
  betObjectId?: string;
  coinType?: 'SUI' | 'SBETS';
  error?: string;
}

export function useOnChainBet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Get user's SBETS coin objects
  const getSbetsCoins = useCallback(async (walletAddress: string): Promise<{objectId: string, balance: number}[]> => {
    try {
      const coins = await suiClient.getCoins({
        owner: walletAddress,
        coinType: SBETS_TOKEN_TYPE,
      });

      return coins.data.map(coin => ({
        objectId: coin.coinObjectId,
        balance: parseInt(coin.balance) / 1_000_000_000,
      }));
    } catch (err) {
      console.error('Failed to get SBETS coins:', err);
      return [];
    }
  }, [suiClient]);

  // Place bet on-chain (SUI or SBETS)
  const placeBetOnChain = useCallback(async (params: OnChainBetParams): Promise<OnChainBetResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { eventId, marketId, prediction, betAmount, odds, walrusBlobId = '', coinType = 'SUI', sbetsCoinObjectId } = params;
      
      // Convert to smallest units (1 SUI/SBETS = 1_000_000_000)
      const betAmountMist = Math.floor(betAmount * 1_000_000_000);
      // Convert odds to basis points (e.g., 2.50 -> 250)
      const oddsBps = Math.floor(odds * 100);

      const tx = new Transaction();
      
      if (coinType === 'SUI') {
        // SUI bet - split from gas coin
        const [coin] = tx.splitCoins(tx.gas, [betAmountMist]);
        
        tx.moveCall({
          target: `${BETTING_PACKAGE_ID}::betting::place_bet`,
          arguments: [
            tx.object(BETTING_PLATFORM_ID),
            coin,
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(eventId))),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(marketId))),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(prediction))),
            tx.pure.u64(oddsBps),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusBlobId))),
            tx.object(CLOCK_OBJECT_ID),
          ],
        });
      } else if (coinType === 'SBETS') {
        // SBETS bet - requires user's SBETS coin object
        if (!sbetsCoinObjectId) {
          throw new Error('SBETS coin object ID required for SBETS bets');
        }
        
        // For SBETS, we need to split the coin and handle the remainder
        // Split exact bet amount from user's SBETS coin
        const [sbetsCoin] = tx.splitCoins(tx.object(sbetsCoinObjectId), [betAmountMist]);
        
        // The original coin (with remainder) stays with the owner automatically
        // The split coin is consumed by place_bet_sbets
        tx.moveCall({
          target: `${BETTING_PACKAGE_ID}::betting::place_bet_sbets`,
          arguments: [
            tx.object(BETTING_PLATFORM_ID),
            sbetsCoin,
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(eventId))),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(marketId))),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(prediction))),
            tx.pure.u64(oddsBps),
            tx.pure.vector('u8', Array.from(new TextEncoder().encode(walrusBlobId))),
            tx.object(CLOCK_OBJECT_ID),
          ],
        });
      } else {
        throw new Error(`Unsupported coin type: ${coinType}`);
      }

      toast({
        title: "Signing Transaction",
        description: `Please approve the ${coinType} bet in your wallet...`,
      });

      const result = await signAndExecute({
        transaction: tx,
      });

      if (!result.digest) {
        throw new Error('Transaction failed - no digest returned');
      }

      const txDetails = await suiClient.waitForTransaction({
        digest: result.digest,
        options: { showEffects: true, showObjectChanges: true },
      });

      let betObjectId: string | undefined;
      if (txDetails.objectChanges) {
        const createdBet = txDetails.objectChanges.find(
          (change) => change.type === 'created' && change.objectType?.includes('::betting::Bet')
        );
        if (createdBet && 'objectId' in createdBet) {
          betObjectId = createdBet.objectId;
        }
      }

      toast({
        title: `${coinType} Bet Placed On-Chain!`,
        description: `Transaction confirmed: ${result.digest.slice(0, 12)}...`,
        variant: "default",
      });

      setIsLoading(false);
      return {
        success: true,
        txDigest: result.digest,
        betObjectId,
        coinType,
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to place bet on-chain';
      setError(errorMessage);
      setIsLoading(false);

      toast({
        title: "On-Chain Bet Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [signAndExecute, suiClient, toast]);

  return {
    placeBetOnChain,
    getSbetsCoins,
    isLoading,
    error,
    SBETS_TOKEN_TYPE,
  };
}
