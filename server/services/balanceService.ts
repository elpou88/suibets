/**
 * User Balance Management Service - PERSISTENT DATABASE VERSION
 * Tracks SUI and SBETS token balances for each user in PostgreSQL
 * Balances survive server restarts and are reliable for settlement
 */

import { storage } from '../storage';

export interface UserBalance {
  userId: string;
  suiBalance: number;
  sbetsBalance: number;
  totalBetAmount: number;
  totalWinnings: number;
  lastUpdated: number;
}

export class BalanceService {
  private balanceCache: Map<string, UserBalance> = new Map();
  private cacheExpiry = 30000; // 30 second cache

  /**
   * Get user balance from database (with caching for performance)
   */
  async getBalanceAsync(userId: string): Promise<UserBalance> {
    const cached = this.balanceCache.get(userId);
    if (cached && Date.now() - cached.lastUpdated < this.cacheExpiry) {
      return cached;
    }

    const dbBalance = await storage.getUserBalance(userId);
    
    const balance: UserBalance = {
      userId,
      suiBalance: dbBalance?.suiBalance || 0,
      sbetsBalance: dbBalance?.sbetsBalance || 0,
      totalBetAmount: 0,
      totalWinnings: 0,
      lastUpdated: Date.now()
    };

    this.balanceCache.set(userId, balance);
    return balance;
  }

  /**
   * Synchronous balance getter (uses cache, falls back to 0)
   */
  getBalance(userId: string): UserBalance {
    const cached = this.balanceCache.get(userId);
    if (cached) {
      return cached;
    }

    // Return default, async load will populate
    const balance: UserBalance = {
      userId,
      suiBalance: 0,
      sbetsBalance: 0,
      totalBetAmount: 0,
      totalWinnings: 0,
      lastUpdated: Date.now()
    };

    // Trigger async load
    this.getBalanceAsync(userId).catch(console.error);
    
    return balance;
  }

  /**
   * Check if a transaction hash has already been processed
   */
  async isTxProcessed(txHash: string): Promise<boolean> {
    return await storage.isTransactionProcessed(txHash);
  }

  /**
   * Deduct bet amount from user balance (supports SUI or SBETS)
   * PERSISTS TO DATABASE
   */
  async deductForBet(userId: string, amount: number, fee: number, currency: 'SUI' | 'SBETS' = 'SUI'): Promise<boolean> {
    const balance = await this.getBalanceAsync(userId);
    const totalDebit = amount + fee;

    if (currency === 'SBETS') {
      if (balance.sbetsBalance < totalDebit) {
        console.warn(`❌ Insufficient SBETS for ${userId}: ${balance.sbetsBalance} SBETS < ${totalDebit} SBETS needed`);
        return false;
      }
      
      // Update database
      await storage.updateUserBalance(userId, 0, -totalDebit);
      await storage.recordWalletOperation(userId, 'bet_placed', totalDebit, `bet-${Date.now()}`, { currency: 'SBETS', fee });
      
      // Update cache
      balance.sbetsBalance -= totalDebit;
      balance.totalBetAmount += amount;
      balance.lastUpdated = Date.now();
      
      console.log(`💰 BET DEDUCTED (DB): ${userId.slice(0, 8)}... - ${amount} SBETS (Fee: ${fee} SBETS) | Balance: ${balance.sbetsBalance} SBETS`);
    } else {
      if (balance.suiBalance < totalDebit) {
        console.warn(`❌ Insufficient balance for ${userId}: ${balance.suiBalance} SUI < ${totalDebit} SUI needed`);
        return false;
      }
      
      // Update database
      await storage.updateUserBalance(userId, -totalDebit, 0);
      await storage.recordWalletOperation(userId, 'bet_placed', totalDebit, `bet-${Date.now()}`, { currency: 'SUI', fee });
      
      // Update cache
      balance.suiBalance -= totalDebit;
      balance.totalBetAmount += amount;
      balance.lastUpdated = Date.now();
      
      console.log(`💰 BET DEDUCTED (DB): ${userId.slice(0, 8)}... - ${amount} SUI (Fee: ${fee} SUI) | Balance: ${balance.suiBalance} SUI`);
    }

    return true;
  }

  /**
   * Add winnings to user balance (supports SUI or SBETS)
   * PERSISTS TO DATABASE
   */
  async addWinnings(userId: string, amount: number, currency: 'SUI' | 'SBETS' = 'SUI'): Promise<void> {
    const balance = await this.getBalanceAsync(userId);
    
    if (currency === 'SBETS') {
      // Update database
      await storage.updateUserBalance(userId, 0, amount);
      await storage.recordWalletOperation(userId, 'bet_won', amount, `win-${Date.now()}`, { currency: 'SBETS' });
      
      // Update cache
      balance.sbetsBalance += amount;
      balance.totalWinnings += amount;
      balance.lastUpdated = Date.now();
      
      console.log(`🎉 WINNINGS ADDED (DB): ${userId.slice(0, 8)}... - ${amount} SBETS | New Balance: ${balance.sbetsBalance} SBETS`);
    } else {
      // Update database
      await storage.updateUserBalance(userId, amount, 0);
      await storage.recordWalletOperation(userId, 'bet_won', amount, `win-${Date.now()}`, { currency: 'SUI' });
      
      // Update cache
      balance.suiBalance += amount;
      balance.totalWinnings += amount;
      balance.lastUpdated = Date.now();
      
      console.log(`🎉 WINNINGS ADDED (DB): ${userId.slice(0, 8)}... - ${amount} SUI | New Balance: ${balance.suiBalance} SUI`);
    }
  }

  /**
   * Withdraw SUI to wallet - PERSISTS TO DATABASE
   */
  async withdraw(userId: string, amount: number): Promise<{ success: boolean; txHash?: string; message: string }> {
    const balance = await this.getBalanceAsync(userId);

    if (amount < 0.1) {
      return { success: false, message: 'Minimum withdrawal is 0.1 SUI' };
    }

    if (amount > balance.suiBalance) {
      return { success: false, message: `Insufficient balance. Available: ${balance.suiBalance} SUI` };
    }

    const txHash = `tx-${userId.slice(0, 8)}-${Date.now()}`;

    // Update database
    await storage.updateUserBalance(userId, -amount, 0);
    await storage.recordWalletOperation(userId, 'withdrawal', amount, txHash, { status: 'completed' });

    // Update cache
    balance.suiBalance -= amount;
    balance.lastUpdated = Date.now();

    console.log(`💸 WITHDRAWAL COMPLETED (DB): ${userId.slice(0, 8)}... - ${amount} SUI | TX: ${txHash}`);
    return {
      success: true,
      txHash,
      message: `Successfully withdrawn ${amount} SUI`
    };
  }

  /**
   * Deposit SUI to account with txHash deduplication
   * PERSISTS TO DATABASE - Returns false if txHash was already processed
   */
  async deposit(userId: string, amount: number, txHash?: string, reason: string = 'Wallet deposit'): Promise<{ success: boolean; message: string }> {
    // DUPLICATE PREVENTION: Check if this txHash was already processed
    if (txHash) {
      const alreadyProcessed = await storage.isTransactionProcessed(txHash);
      if (alreadyProcessed) {
        console.warn(`⚠️ DUPLICATE DEPOSIT BLOCKED: txHash ${txHash} already processed`);
        return { success: false, message: 'Transaction already processed' };
      }
    }

    // Update database
    await storage.updateUserBalance(userId, amount, 0);
    await storage.recordWalletOperation(userId, 'deposit', amount, txHash || `deposit-${Date.now()}`, { reason });

    // Update cache
    const balance = await this.getBalanceAsync(userId);
    balance.suiBalance += amount;
    balance.lastUpdated = Date.now();

    console.log(`💳 DEPOSIT ADDED (DB): ${userId.slice(0, 8)}... - ${amount} SUI (${reason}) txHash: ${txHash} | Balance: ${balance.suiBalance} SUI`);
    return { success: true, message: `Deposited ${amount} SUI` };
  }

  /**
   * Add revenue from lost bets to platform wallet
   * PERSISTS TO DATABASE
   */
  async addRevenue(amount: number, currency: 'SUI' | 'SBETS' = 'SUI'): Promise<void> {
    await storage.addPlatformRevenue(amount, currency);
    
    if (currency === 'SBETS') {
      console.log(`📊 REVENUE ADDED (DB): ${amount} SBETS to platform`);
    } else {
      console.log(`📊 REVENUE ADDED (DB): ${amount} SUI to platform`);
    }
  }

  /**
   * Get platform revenue from database
   */
  async getPlatformRevenue(): Promise<{ suiBalance: number; sbetsBalance: number }> {
    const revenue = await storage.getPlatformRevenue();
    return {
      suiBalance: revenue.suiRevenue,
      sbetsBalance: revenue.sbetsRevenue
    };
  }

  /**
   * Get transaction history from database
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<any[]> {
    return await storage.getWalletOperations(userId, limit);
  }
}

export default new BalanceService();
