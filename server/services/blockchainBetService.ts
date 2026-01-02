import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

const SBETS_PACKAGE_ID = process.env.SBETS_TOKEN_ADDRESS?.split('::')[0] || '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285';
const BETTING_PACKAGE_ID = process.env.BETTING_PACKAGE_ID || '0xf8209567df9e80789ec7036f747d6386a8935b50f065e955a715e364f4f893aa';
const BETTING_PLATFORM_ID = process.env.BETTING_PLATFORM_ID || '0x5fe75eab8aef1c209e0d2b8d53cd601d4efaf22511e82d8504b0f7f6c754df89';
const PLATFORM_REVENUE_WALLET = process.env.PLATFORM_REVENUE_WALLET || '0x20850db591c4d575b5238baf975e54580d800e69b8b5b421de796a311d3bea50';
const ADMIN_WALLET = process.env.ADMIN_WALLET_ADDRESS || '0x747c44940ec9f0136e3accdd81f37d5b3cc1d62d7747968d633cabb6aa5aa45f';
const REVENUE_WALLET = process.env.REVENUE_WALLET_ADDRESS || PLATFORM_REVENUE_WALLET;
// SECURITY: ADMIN_PRIVATE_KEY must be stored as encrypted secret on Railway/production
// NEVER log, expose, or commit this value. Used only for on-chain payouts.
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

// Validate configuration on startup
if (!BETTING_PACKAGE_ID || !BETTING_PLATFORM_ID) {
  console.warn('⚠️ BETTING_PACKAGE_ID or BETTING_PLATFORM_ID not set - on-chain betting disabled');
}
console.log(`📦 Betting Package ID: ${BETTING_PACKAGE_ID}`);
console.log(`🏛️ Platform Object ID: ${BETTING_PLATFORM_ID}`);
console.log(`👤 Admin Wallet: ${ADMIN_WALLET}`);

// SECURITY: Only log existence, never the key itself
if (ADMIN_PRIVATE_KEY) {
  console.log(`🔐 Admin Private Key: CONFIGURED (length: ${ADMIN_PRIVATE_KEY.length})`);
} else {
  console.warn('⚠️ ADMIN_PRIVATE_KEY not set - on-chain payouts/withdrawals will be disabled');
  console.warn('   To enable: Add ADMIN_PRIVATE_KEY as a secret on Railway');
}

export interface OnChainBet {
  betId: string;
  walletAddress: string;
  eventId: string;
  prediction: string;
  betAmount: number;
  odds: number;
  potentialPayout: number;
  txHash: string;
  blockHeight?: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'settled' | 'failed';
}

export interface TransactionPayload {
  target: string;
  arguments: any[];
  typeArguments?: string[];
}

export class BlockchainBetService {
  private client: SuiClient;
  private network: 'mainnet' | 'testnet' | 'devnet';

  constructor() {
    this.network = (process.env.SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet') || 'mainnet';
    this.client = new SuiClient({ url: getFullnodeUrl(this.network) });
    console.log(`BlockchainBetService initialized on ${this.network}`);
  }

  async buildBetTransaction(
    walletAddress: string,
    eventId: string,
    prediction: string,
    betAmount: number,
    odds: number,
    marketId: string = 'match_winner',
    walrusBlobId: string = ''
  ): Promise<TransactionPayload> {
    const oddsInBps = Math.floor(odds * 100);

    return {
      target: `${BETTING_PACKAGE_ID}::betting::place_bet`,
      arguments: [
        BETTING_PLATFORM_ID,
        Array.from(new TextEncoder().encode(eventId)),
        Array.from(new TextEncoder().encode(marketId)),
        Array.from(new TextEncoder().encode(prediction)),
        oddsInBps,
        Array.from(new TextEncoder().encode(walrusBlobId)),
      ],
      typeArguments: []
    };
  }

  buildClientTransaction(
    eventId: string,
    prediction: string,
    betAmountMist: number,
    odds: number,
    marketId: string,
    walrusBlobId: string
  ): {
    packageId: string;
    module: string;
    function: string;
    platformId: string;
    betAmountMist: number;
    clockObjectId: string;
    moveCallArgs: {
      platform: string;
      eventId: number[];
      marketId: number[];
      prediction: number[];
      oddsBps: number;
      walrusBlobId: number[];
    };
    instructions: string;
  } {
    return {
      packageId: BETTING_PACKAGE_ID,
      module: 'betting',
      function: 'place_bet',
      platformId: BETTING_PLATFORM_ID,
      betAmountMist,
      clockObjectId: '0x6',
      moveCallArgs: {
        platform: BETTING_PLATFORM_ID,
        eventId: Array.from(new TextEncoder().encode(eventId)),
        marketId: Array.from(new TextEncoder().encode(marketId)),
        prediction: Array.from(new TextEncoder().encode(prediction)),
        oddsBps: Math.floor(odds * 100),
        walrusBlobId: Array.from(new TextEncoder().encode(walrusBlobId)),
      },
      instructions: `
        1. Split ${betAmountMist} MIST from your SUI coins
        2. Call ${BETTING_PACKAGE_ID}::betting::place_bet with:
           - platform: ${BETTING_PLATFORM_ID} (shared object)
           - payment: [split coin]
           - event_id: [encoded bytes]
           - market_id: [encoded bytes]
           - prediction: [encoded bytes]
           - odds: ${Math.floor(odds * 100)} (in basis points)
           - walrus_blob_id: [encoded bytes]
           - clock: 0x6
      `.trim()
    };
  }

  async buildSettlementTransaction(
    betId: string,
    betObjectId: string,
    won: boolean
  ): Promise<TransactionPayload> {
    return {
      target: `${BETTING_PACKAGE_ID}::betting::settle_bet`,
      arguments: [
        BETTING_PLATFORM_ID,
        betObjectId,
        won
      ],
      typeArguments: []
    };
  }

  getBettingPlatformId(): string {
    return BETTING_PLATFORM_ID;
  }

  async verifyTransaction(txHash: string): Promise<{
    confirmed: boolean;
    blockHeight?: number;
    timestamp?: number;
    effects?: any;
  }> {
    try {
      const txResponse = await this.client.getTransactionBlock({
        digest: txHash,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (txResponse && txResponse.effects) {
        return {
          confirmed: txResponse.effects.status?.status === 'success',
          blockHeight: parseInt(txResponse.checkpoint || '0'),
          timestamp: parseInt(txResponse.timestampMs || '0'),
          effects: txResponse.effects
        };
      }

      return { confirmed: false };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return { confirmed: false };
    }
  }

  async getWalletBalance(walletAddress: string): Promise<{
    sui: number;
    sbets: number;
  }> {
    try {
      const suiBalance = await this.client.getBalance({
        owner: walletAddress,
        coinType: '0x2::sui::SUI'
      });

      let sbetsBalance = { totalBalance: '0' };
      try {
        sbetsBalance = await this.client.getBalance({
          owner: walletAddress,
          coinType: `${SBETS_PACKAGE_ID}::sbets::SBETS`
        });
      } catch (e) {
      }

      return {
        sui: parseInt(suiBalance.totalBalance) / 1e9,
        sbets: parseInt(sbetsBalance.totalBalance) / 1e9
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return { sui: 0, sbets: 0 };
    }
  }

  async recordBetOnChain(bet: {
    betId: string;
    walletAddress: string;
    eventId: string;
    prediction: string;
    betAmount: number;
    odds: number;
    txHash: string;
  }): Promise<OnChainBet> {
    const onChainBet: OnChainBet = {
      betId: bet.betId,
      walletAddress: bet.walletAddress,
      eventId: bet.eventId,
      prediction: bet.prediction,
      betAmount: bet.betAmount,
      odds: bet.odds,
      potentialPayout: bet.betAmount * bet.odds,
      txHash: bet.txHash,
      timestamp: Date.now(),
      status: 'pending'
    };

    if (bet.txHash && bet.txHash.startsWith('0x') && bet.txHash.length > 10) {
      const verification = await this.verifyTransaction(bet.txHash);
      if (verification.confirmed) {
        onChainBet.status = 'confirmed';
        onChainBet.blockHeight = verification.blockHeight;
      }
    }

    console.log(`📦 ON-CHAIN BET RECORDED: ${bet.betId} | ${bet.walletAddress.slice(0, 8)}... | ${bet.betAmount} SUI @ ${bet.odds}x`);

    return onChainBet;
  }

  async getOnChainBetStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    const verification = await this.verifyTransaction(txHash);
    if (verification.confirmed) {
      return 'confirmed';
    }
    return 'pending';
  }

  getPackageId(): string {
    return SBETS_PACKAGE_ID;
  }

  getBettingPackageId(): string {
    return BETTING_PACKAGE_ID;
  }

  getRevenueWallet(): string {
    return REVENUE_WALLET;
  }

  getAdminWallet(): string {
    return ADMIN_WALLET;
  }

  // Check if admin key is configured for on-chain payouts
  isAdminKeyConfigured(): boolean {
    return !!ADMIN_PRIVATE_KEY && ADMIN_PRIVATE_KEY.length > 0;
  }

  // Get admin keypair from private key (for on-chain transactions)
  // Sui SDK's Ed25519Keypair.fromSecretKey expects the 32-byte secret seed
  private getAdminKeypair(): Ed25519Keypair | null {
    if (!ADMIN_PRIVATE_KEY) {
      console.warn('⚠️ ADMIN_PRIVATE_KEY not configured - on-chain payouts disabled');
      return null;
    }
    
    try {
      let keyBytes: Uint8Array;
      
      // Support multiple formats: hex, base64, or Sui bech32 format
      if (ADMIN_PRIVATE_KEY.startsWith('suiprivkey')) {
        // Sui bech32 format - use decodeSuiPrivateKey if available
        try {
          // Try importing the decode function
          const { decodeSuiPrivateKey } = require('@mysten/sui/cryptography');
          const decoded = decodeSuiPrivateKey(ADMIN_PRIVATE_KEY);
          return Ed25519Keypair.fromSecretKey(decoded.secretKey);
        } catch (e) {
          console.error('❌ Failed to parse Sui bech32 private key:', e);
          return null;
        }
      } else if (ADMIN_PRIVATE_KEY.startsWith('0x')) {
        // Hex format
        const hexKey = ADMIN_PRIVATE_KEY.slice(2);
        keyBytes = new Uint8Array(Buffer.from(hexKey, 'hex'));
      } else {
        // Assume base64 encoding
        keyBytes = new Uint8Array(Buffer.from(ADMIN_PRIVATE_KEY, 'base64'));
      }
      
      // Handle different key formats:
      // - 32 bytes: raw secret seed (ready to use)
      // - 33 bytes: 1 scheme byte + 32 secret seed (strip scheme)
      // - 64 bytes: 32 secret + 32 public (use first 32)
      // - 65 bytes: 1 scheme + 32 secret + 32 public (strip scheme, use first 32)
      
      if (keyBytes.length === 33 && keyBytes[0] === 0) {
        // Strip the scheme byte prefix (0x00 for Ed25519)
        keyBytes = keyBytes.slice(1);
      } else if (keyBytes.length === 65 && keyBytes[0] === 0) {
        // Strip scheme byte and take first 32 bytes (secret seed)
        keyBytes = keyBytes.slice(1, 33);
      } else if (keyBytes.length === 64) {
        // Full keypair format (secret + public), take only first 32 bytes
        keyBytes = keyBytes.slice(0, 32);
      }
      
      if (keyBytes.length !== 32) {
        console.error(`❌ Invalid private key length: ${keyBytes.length} (expected 32 bytes)`);
        console.error('   Supported formats: 32-byte raw seed, 33-byte with scheme prefix, or suiprivkey bech32');
        return null;
      }
      
      const keypair = Ed25519Keypair.fromSecretKey(keyBytes);
      console.log(`✅ Admin keypair loaded: ${keypair.toSuiAddress().slice(0, 12)}...`);
      return keypair;
    } catch (error) {
      console.error('❌ Failed to parse ADMIN_PRIVATE_KEY:', error);
      return null;
    }
  }

  // Execute on-chain SUI payout to user (for withdrawals)
  // Returns explicit error if keypair loading fails
  async executePayoutOnChain(
    recipientAddress: string,
    amountSui: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const keypair = this.getAdminKeypair();
    if (!keypair) {
      const error = 'Admin private key not configured or invalid format';
      console.error(`❌ PAYOUT BLOCKED: ${error}`);
      return { success: false, error };
    }

    try {
      const amountMist = Math.floor(amountSui * 1e9);
      
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [amountMist]);
      tx.transferObjects([coin], recipientAddress);

      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      if (result.effects?.status?.status === 'success') {
        console.log(`✅ ON-CHAIN PAYOUT: ${amountSui} SUI to ${recipientAddress} | TX: ${result.digest}`);
        return { success: true, txHash: result.digest };
      } else {
        console.error(`❌ PAYOUT FAILED: ${result.effects?.status?.error || 'Unknown error'}`);
        return { success: false, error: result.effects?.status?.error || 'Transaction failed' };
      }
    } catch (error: any) {
      console.error('❌ Payout execution error:', error);
      return { success: false, error: error.message || 'Failed to execute payout' };
    }
  }

  // Get treasury balance (admin wallet balance)
  async getTreasuryBalance(): Promise<{ sui: number; sbets: number }> {
    return this.getWalletBalance(PLATFORM_REVENUE_WALLET);
  }
}

export const blockchainBetService = new BlockchainBetService();
export default blockchainBetService;
