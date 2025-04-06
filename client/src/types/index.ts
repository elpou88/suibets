import { WalletType, User, Sport, Event, Bet, Promotion, Notification } from "@shared/schema";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectWallet: (address: string, walletType: WalletType) => Promise<void>;
  disconnectWallet: () => void;
}

export interface BettingContextType {
  selectedBets: SelectedBet[];
  addBet: (bet: SelectedBet) => void;
  removeBet: (betId: string) => void;
  clearBets: () => void;
  placeBet: (betAmount: number) => Promise<boolean>;
  totalStake: number;
  potentialWinnings: number;
  updateStake: (id: string, amount: number) => void;
}

export interface SelectedBet {
  id: string;
  eventId: number;
  eventName: string;
  selectionName: string;
  odds: number;
  stake: number;
  market: string;
  marketId?: number; // Added for proper parlay creation
  outcomeId?: number; // Added for proper outcome reference
}

export interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export { WalletType, User, Sport, Event, Bet, Promotion, Notification };
