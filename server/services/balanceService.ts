/**
 * User Balance Management Service
 * Tracks SUI and SBETS token balances for each user
 */

export interface UserBalance {
  userId: string;
  suiBalance: number;
  sbetsBalance: number;
  totalBetAmount: number;
  totalWinnings: number;
  lastUpdated: number;
}

export class BalanceService {
  private balances: Map<string, UserBalance> = new Map();
  private transactionHistory: Map<string, any[]> = new Map();
  private processedTxHashes: Set<string> = new Set(); // Prevent duplicate deposits

  /**
   * Get user balance - starts at 0 for new users (no mock balances)
   */
  getBalance(userId: string): UserBalance {
    if (!this.balances.has(userId)) {
      this.balances.set(userId, {
        userId,
        suiBalance: 0, // New users start with 0 - must deposit real funds
        sbetsBalance: 0, // New users start with 0 - must deposit real funds
        totalBetAmount: 0,
        totalWinnings: 0,
        lastUpdated: Date.now()
      });
    }
    return this.balances.get(userId)!;
  }

  /**
   * Check if a transaction hash has already been processed
   */
  isTxProcessed(txHash: string): boolean {
    return this.processedTxHashes.has(txHash);
  }

  /**
   * Mark a transaction hash as processed
   */
  markTxProcessed(txHash: string): void {
    this.processedTxHashes.add(txHash);
  }

  /**
   * Deduct bet amount from user balance (supports SUI or SBETS)
   */
  deductForBet(userId: string, amount: number, fee: number, currency: 'SUI' | 'SBETS' = 'SUI'): boolean {
    const balance = this.getBalance(userId);
    const totalDebit = amount + fee;

    if (currency === 'SBETS') {
      if (balance.sbetsBalance < totalDebit) {
        console.warn(`❌ Insufficient SBETS for ${userId}: ${balance.sbetsBalance} SBETS < ${totalDebit} SBETS needed`);
        return false;
      }
      balance.sbetsBalance -= totalDebit;
      this.addTransaction(userId, {
        type: 'bet_placed',
        currency: 'SBETS',
        amount,
        fee,
        balance: balance.sbetsBalance,
        timestamp: Date.now()
      });
      console.log(`💰 BET DEDUCTED: ${userId} - ${amount} SBETS (Fee: ${fee} SBETS) | Balance: ${balance.sbetsBalance} SBETS`);
    } else {
      if (balance.suiBalance < totalDebit) {
        console.warn(`❌ Insufficient balance for ${userId}: ${balance.suiBalance} SUI < ${totalDebit} SUI needed`);
        return false;
      }
      balance.suiBalance -= totalDebit;
      this.addTransaction(userId, {
        type: 'bet_placed',
        currency: 'SUI',
        amount,
        fee,
        balance: balance.suiBalance,
        timestamp: Date.now()
      });
      console.log(`💰 BET DEDUCTED: ${userId} - ${amount} SUI (Fee: ${fee} SUI) | Balance: ${balance.suiBalance} SUI`);
    }

    balance.totalBetAmount += amount;
    balance.lastUpdated = Date.now();
    return true;
  }

  /**
   * Add winnings to user balance (supports SUI or SBETS)
   */
  addWinnings(userId: string, amount: number, currency: 'SUI' | 'SBETS' = 'SUI'): void {
    const balance = this.getBalance(userId);
    
    if (currency === 'SBETS') {
      balance.sbetsBalance += amount;
      this.addTransaction(userId, {
        type: 'bet_won',
        currency: 'SBETS',
        amount,
        balance: balance.sbetsBalance,
        timestamp: Date.now()
      });
      console.log(`🎉 WINNINGS ADDED: ${userId} - ${amount} SBETS | New Balance: ${balance.sbetsBalance} SBETS`);
    } else {
      balance.suiBalance += amount;
      this.addTransaction(userId, {
        type: 'bet_won',
        currency: 'SUI',
        amount,
        balance: balance.suiBalance,
        timestamp: Date.now()
      });
      console.log(`🎉 WINNINGS ADDED: ${userId} - ${amount} SUI | New Balance: ${balance.suiBalance} SUI`);
    }
    
    balance.totalWinnings += amount;
    balance.lastUpdated = Date.now();
  }

  /**
   * Withdraw SUI to wallet
   */
  withdraw(userId: string, amount: number): { success: boolean; txHash?: string; message: string } {
    const balance = this.getBalance(userId);

    if (amount < 0.1) {
      return { success: false, message: 'Minimum withdrawal is 0.1 SUI' };
    }

    if (amount > balance.suiBalance) {
      return { success: false, message: `Insufficient balance. Available: ${balance.suiBalance} SUI` };
    }

    // Simulate withdrawal
    balance.suiBalance -= amount;
    const txHash = `tx-${userId}-${Date.now()}`;

    this.addTransaction(userId, {
      type: 'withdrawal',
      amount,
      txHash,
      balance: balance.suiBalance,
      timestamp: Date.now(),
      status: 'completed'
    });

    console.log(`💸 WITHDRAWAL COMPLETED: ${userId} - ${amount} SUI | TX: ${txHash}`);
    return {
      success: true,
      txHash,
      message: `Successfully withdrawn ${amount} SUI`
    };
  }

  /**
   * Deposit SUI to account with txHash deduplication
   * Returns false if txHash was already processed (prevents double-crediting)
   */
  deposit(userId: string, amount: number, txHash?: string, reason: string = 'Wallet deposit'): { success: boolean; message: string } {
    // DUPLICATE PREVENTION: Check if this txHash was already processed
    if (txHash && this.processedTxHashes.has(txHash)) {
      console.warn(`⚠️ DUPLICATE DEPOSIT BLOCKED: txHash ${txHash} already processed`);
      return { success: false, message: 'Transaction already processed' };
    }

    const balance = this.getBalance(userId);
    balance.suiBalance += amount;
    balance.lastUpdated = Date.now();

    // Mark txHash as processed to prevent replay
    if (txHash) {
      this.processedTxHashes.add(txHash);
    }

    this.addTransaction(userId, {
      type: 'deposit',
      amount,
      txHash,
      reason,
      balance: balance.suiBalance,
      timestamp: Date.now()
    });

    console.log(`💳 DEPOSIT ADDED: ${userId} - ${amount} SUI (${reason}) txHash: ${txHash} | Balance: ${balance.suiBalance} SUI`);
    return { success: true, message: `Deposited ${amount} SUI` };
  }

  /**
   * Add revenue from lost bets to platform wallet
   */
  addRevenue(amount: number, currency: 'SUI' | 'SBETS' = 'SUI'): void {
    const platformBalance = this.getBalance('platform_revenue');
    
    if (currency === 'SBETS') {
      platformBalance.sbetsBalance += amount;
      console.log(`📊 REVENUE ADDED: ${amount} SBETS to platform | Total: ${platformBalance.sbetsBalance} SBETS`);
    } else {
      platformBalance.suiBalance += amount;
      console.log(`📊 REVENUE ADDED: ${amount} SUI to platform | Total: ${platformBalance.suiBalance} SUI`);
    }
    
    platformBalance.lastUpdated = Date.now();
  }

  /**
   * Get platform revenue
   */
  getPlatformRevenue(): UserBalance {
    return this.getBalance('platform_revenue');
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(userId: string, limit: number = 50): any[] {
    const history = this.transactionHistory.get(userId) || [];
    return history.slice(0, limit);
  }

  /**
   * Add transaction to history
   */
  private addTransaction(userId: string, transaction: any): void {
    if (!this.transactionHistory.has(userId)) {
      this.transactionHistory.set(userId, []);
    }
    const history = this.transactionHistory.get(userId)!;
    history.unshift(transaction); // Add to beginning
    
    // Keep last 100 transactions
    if (history.length > 100) {
      history.pop();
    }
  }
}

export default new BalanceService();
