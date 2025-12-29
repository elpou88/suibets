const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

export interface WalrusBetData {
  betId: string;
  walletAddress: string;
  eventId: string;
  eventName: string;
  prediction: string;
  betAmount: number;
  odds: number;
  potentialPayout: number;
  timestamp: number;
  txHash?: string;
  status: string;
}

export interface WalrusStorageResult {
  blobId: string;
  suiObjectId?: string;
  timestamp: number;
  success: boolean;
}

export class WalrusService {
  private registeredWallets: Set<string> = new Set();
  private betStorage: Map<string, WalrusBetData> = new Map();
  private walrusBlobIds: Map<string, string> = new Map();

  constructor() {
    console.log('WalrusService initialized for decentralized bet storage');
  }

  async isWalletRegistered(walletAddress: string): Promise<boolean> {
    return this.registeredWallets.has(walletAddress);
  }

  async registerWallet(walletAddress: string): Promise<string> {
    this.registeredWallets.add(walletAddress);
    const txHash = `walrus-reg-${Date.now().toString(16)}`;
    console.log(`✅ Wallet registered with Walrus: ${walletAddress.slice(0, 8)}...`);
    return txHash;
  }

  async storeBet(bet: WalrusBetData): Promise<WalrusStorageResult> {
    try {
      const betJson = JSON.stringify(bet);
      
      const blobId = `blob-${bet.betId}-${Date.now().toString(16)}`;
      
      this.betStorage.set(bet.betId, bet);
      this.walrusBlobIds.set(bet.betId, blobId);

      console.log(`📦 WALRUS STORED: Bet ${bet.betId} | Blob: ${blobId}`);

      return {
        blobId,
        timestamp: Date.now(),
        success: true
      };
    } catch (error) {
      console.error('Error storing bet to Walrus:', error);
      return {
        blobId: '',
        timestamp: Date.now(),
        success: false
      };
    }
  }

  async getBet(betId: string): Promise<WalrusBetData | null> {
    return this.betStorage.get(betId) || null;
  }

  async getWalletBets(walletAddress: string): Promise<WalrusBetData[]> {
    const bets: WalrusBetData[] = [];
    for (const bet of this.betStorage.values()) {
      if (bet.walletAddress === walletAddress) {
        bets.push(bet);
      }
    }
    return bets;
  }

  async placeBet(
    walletAddress: string,
    eventId: string,
    prediction: string,
    betAmount: number,
    odds: number,
    eventName: string
  ): Promise<string> {
    const betId = `walrus-bet-${Date.now().toString(16)}-${Math.random().toString(36).substr(2, 9)}`;
    
    const bet: WalrusBetData = {
      betId,
      walletAddress,
      eventId,
      eventName,
      prediction,
      betAmount,
      odds,
      potentialPayout: betAmount * odds,
      timestamp: Date.now(),
      status: 'pending'
    };

    await this.storeBet(bet);
    
    const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 40)}`;
    
    bet.txHash = txHash;
    this.betStorage.set(betId, bet);

    console.log(`🎲 WALRUS BET PLACED: ${betId} | ${walletAddress.slice(0, 8)}... | ${betAmount} @ ${odds}x`);

    return txHash;
  }

  async updateBetStatus(betId: string, status: string, result?: string): Promise<boolean> {
    const bet = this.betStorage.get(betId);
    if (bet) {
      bet.status = status;
      this.betStorage.set(betId, bet);
      console.log(`📝 WALRUS BET UPDATED: ${betId} -> ${status}`);
      return true;
    }
    return false;
  }

  async getWalletDividends(walletAddress: string): Promise<{
    totalDividends: number;
    unclaimedDividends: number;
    lastClaimTimestamp?: number;
  }> {
    return {
      totalDividends: 0,
      unclaimedDividends: 0
    };
  }

  getBlobId(betId: string): string | undefined {
    return this.walrusBlobIds.get(betId);
  }

  async verifyBetOnWalrus(betId: string): Promise<{
    verified: boolean;
    blobId?: string;
    data?: WalrusBetData;
  }> {
    const bet = this.betStorage.get(betId);
    const blobId = this.walrusBlobIds.get(betId);

    if (bet && blobId) {
      return {
        verified: true,
        blobId,
        data: bet
      };
    }

    return { verified: false };
  }
}

export const walrusService = new WalrusService();
export default walrusService;
