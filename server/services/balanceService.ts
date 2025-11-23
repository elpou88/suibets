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

  /**
   * Get user balance
   */
  getBalance(userId: string): UserBalance {
    if (!this.balances.has(userId)) {
      this.balances.set(userId, {
        userId,
        suiBalance: 100, // Default 100 SUI for new users
        sbetsBalance: 1000, // Default 1000 SBETS for new users
        totalBetAmount: 0,
        totalWinnings: 0,
        lastUpdated: Date.now()
      });
    }
    return this.balances.get(userId)!;
  }

  /**
   * Deduct bet amount from user balance
   */
  deductForBet(userId: string, amount: number, fee: number): boolean {
    const balance = this.getBalance(userId);
    const totalDebit = amount + fee;

    if (balance.suiBalance < totalDebit) {
      console.warn(`❌ Insufficient balance for ${userId}: ${balance.suiBalance} SUI < ${totalDebit} SUI needed`);
      return false;
    }

    balance.suiBalance -= totalDebit;
    balance.totalBetAmount += amount;
    balance.lastUpdated = Date.now();

    this.addTransaction(userId, {
      type: 'bet_placed',
      amount,
      fee,
      balance: balance.suiBalance,
      timestamp: Date.now()
    });

    console.log(`💰 BET DEDUCTED: ${userId} - ${amount} SUI (Fee: ${fee} SUI) | Balance: ${balance.suiBalance} SUI`);
    return true;
  }

  /**
   * Add winnings to user balance
   */
  addWinnings(userId: string, amount: number): void {
    const balance = this.getBalance(userId);
    balance.suiBalance += amount;
    balance.totalWinnings += amount;
    balance.lastUpdated = Date.now();

    this.addTransaction(userId, {
      type: 'bet_won',
      amount,
      balance: balance.suiBalance,
      timestamp: Date.now()
    });

    console.log(`🎉 WINNINGS ADDED: ${userId} - ${amount} SUI | New Balance: ${balance.suiBalance} SUI`);
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
   * Deposit SUI to account (admin only)
   */
  deposit(userId: string, amount: number, reason: string = 'Manual deposit'): void {
    const balance = this.getBalance(userId);
    balance.suiBalance += amount;
    balance.lastUpdated = Date.now();

    this.addTransaction(userId, {
      type: 'deposit',
      amount,
      reason,
      balance: balance.suiBalance,
      timestamp: Date.now()
    });

    console.log(`💳 DEPOSIT ADDED: ${userId} - ${amount} SUI (${reason}) | Balance: ${balance.suiBalance} SUI`);
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
