import { useState, useCallback } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useToast } from '@/hooks/use-toast';

const BETTING_PACKAGE_ID = '0xf8209567df9e80789ec7036f747d6386a8935b50f065e955a715e364f4f893aa';
const BETTING_PLATFORM_ID = '0x5fe75eab8aef1c209e0d2b8d53cd601d4efaf22511e82d8504b0f7f6c754df89';
const CLOCK_OBJECT_ID = '0x6';

export interface OnChainBetParams {
  eventId: string;
  marketId: string;
  prediction: string;
  betAmountSui: number;
  odds: number;
  walrusBlobId?: string;
}

export interface OnChainBetResult {
  success: boolean;
  txDigest?: string;
  betObjectId?: string;
  error?: string;
}

export function useOnChainBet() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const placeBetOnChain = useCallback(async (params: OnChainBetParams): Promise<OnChainBetResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { eventId, marketId, prediction, betAmountSui, odds, walrusBlobId = '' } = params;
      
      const betAmountMist = Math.floor(betAmountSui * 1_000_000_000);
      const oddsBps = Math.floor(odds * 100);

      const tx = new Transaction();
      
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

      toast({
        title: "Signing Transaction",
        description: "Please approve the transaction in your wallet...",
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
        title: "Bet Placed On-Chain!",
        description: `Transaction confirmed: ${result.digest.slice(0, 12)}...`,
        variant: "default",
      });

      setIsLoading(false);
      return {
        success: true,
        txDigest: result.digest,
        betObjectId,
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
    isLoading,
    error,
  };
}
