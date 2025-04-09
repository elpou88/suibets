/**
 * TuskyService - Integration with Tusky.io for decentralized storage
 * 
 * This service provides methods to interact with Tusky's vaults for storing
 * betting data, user profiles, and other app-related information in a 
 * decentralized manner.
 */

import axios from 'axios';
import { useWalletAdapter } from '@/components/wallet/WalletAdapter';

// Tusky API configuration
const TUSKY_API_BASE_URL = 'https://api.tusky.io';
const TUSKY_APP_URL = 'https://app.tusky.io';

// Define vault types we'll use in our application
export enum VaultType {
  USER_PROFILE = 'user_profile',
  BETTING_HISTORY = 'betting_history',
  STAKING_DATA = 'staking_data',
  USER_PREFERENCES = 'user_preferences',
}

// Tusky service class
export class TuskyService {
  private apiKey: string | null = null;
  private walletAddress: string | null = null;
  
  constructor(walletAddress?: string, apiKey?: string) {
    this.walletAddress = walletAddress || null;
    this.apiKey = apiKey || null;
  }
  
  /**
   * Set the wallet address for the user
   */
  public setWalletAddress(address: string) {
    this.walletAddress = address;
  }
  
  /**
   * Set API key if required for privileged operations
   */
  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Create a new vault in Tusky for a specific purpose
   */
  public async createVault(
    name: string,
    description: string, 
    vaultType: VaultType
  ): Promise<{ vaultId: string }> {
    try {
      if (!this.walletAddress) {
        throw new Error('Wallet not connected. Please connect wallet before creating a vault.');
      }
      
      const response = await axios.post(
        `${TUSKY_API_BASE_URL}/vaults`, 
        {
          name,
          description,
          owner: this.walletAddress,
          metadata: {
            type: vaultType,
            appId: 'suibets',
            createdAt: new Date().toISOString(),
          }
        },
        this.getRequestConfig()
      );
      
      return { vaultId: response.data.vaultId };
    } catch (error) {
      console.error('Error creating Tusky vault:', error);
      throw new Error('Failed to create storage vault');
    }
  }
  
  /**
   * Retrieve all vaults owned by the current wallet address
   */
  public async getVaults(): Promise<any[]> {
    try {
      if (!this.walletAddress) {
        throw new Error('Wallet not connected. Please connect wallet before accessing vaults.');
      }
      
      const response = await axios.get(
        `${TUSKY_API_BASE_URL}/vaults?owner=${this.walletAddress}`,
        this.getRequestConfig()
      );
      
      return response.data.vaults || [];
    } catch (error) {
      console.error('Error fetching Tusky vaults:', error);
      throw new Error('Failed to fetch storage vaults');
    }
  }
  
  /**
   * Store data in a specific vault
   */
  public async storeData(vaultId: string, key: string, data: any): Promise<boolean> {
    try {
      if (!this.walletAddress) {
        throw new Error('Wallet not connected. Please connect wallet before storing data.');
      }
      
      const response = await axios.post(
        `${TUSKY_API_BASE_URL}/vaults/${vaultId}/data`,
        {
          key,
          value: JSON.stringify(data),
          metadata: {
            updatedAt: new Date().toISOString(),
            updatedBy: this.walletAddress,
          }
        },
        this.getRequestConfig()
      );
      
      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error('Error storing data in Tusky vault:', error);
      throw new Error('Failed to store data in vault');
    }
  }
  
  /**
   * Retrieve data from a specific vault by key
   */
  public async getData(vaultId: string, key: string): Promise<any> {
    try {
      const response = await axios.get(
        `${TUSKY_API_BASE_URL}/vaults/${vaultId}/data/${key}`,
        this.getRequestConfig()
      );
      
      if (response.data && response.data.value) {
        return JSON.parse(response.data.value);
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving data from Tusky vault:', error);
      throw new Error('Failed to retrieve data from vault');
    }
  }
  
  /**
   * Delete data from a specific vault by key
   */
  public async deleteData(vaultId: string, key: string): Promise<boolean> {
    try {
      if (!this.walletAddress) {
        throw new Error('Wallet not connected. Please connect wallet before deleting data.');
      }
      
      const response = await axios.delete(
        `${TUSKY_API_BASE_URL}/vaults/${vaultId}/data/${key}`,
        this.getRequestConfig()
      );
      
      return response.status === 200 || response.status === 204;
    } catch (error) {
      console.error('Error deleting data from Tusky vault:', error);
      throw new Error('Failed to delete data from vault');
    }
  }
  
  /**
   * Get a URL to access the vault on Tusky's web UI
   */
  public getVaultUrl(vaultId: string): string {
    return `${TUSKY_APP_URL}/vaults/${vaultId}`;
  }
  
  /**
   * Helper to get request configuration with authorization if available
   */
  private getRequestConfig() {
    const config: any = {
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (this.apiKey) {
      config.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return config;
  }
}

// React hook to use the Tusky service with current wallet
export function useTuskyStorage() {
  const { address, isConnected } = useWalletAdapter();
  
  const tuskyService = new TuskyService(address || undefined);
  
  // Initialize a vault for the current user if it doesn't exist
  const initializeUserVault = async (vaultType: VaultType): Promise<string> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected. Please connect your wallet.');
    }
    
    try {
      // Check if user already has a vault of this type
      const vaults = await tuskyService.getVaults();
      const existingVault = vaults.find(v => 
        v.metadata && v.metadata.type === vaultType
      );
      
      if (existingVault) {
        return existingVault.id;
      }
      
      // Create a new vault if none exists
      const { vaultId } = await tuskyService.createVault(
        `SuiBets ${vaultType.replace('_', ' ')}`,
        `Storage vault for SuiBets ${vaultType.replace('_', ' ')} data`,
        vaultType
      );
      
      return vaultId;
    } catch (error) {
      console.error('Error initializing Tusky vault:', error);
      throw new Error('Failed to initialize storage vault');
    }
  };
  
  return {
    tuskyService,
    initializeUserVault,
    storeUserData: async (key: string, data: any): Promise<boolean> => {
      const vaultId = await initializeUserVault(VaultType.USER_PROFILE);
      return tuskyService.storeData(vaultId, key, data);
    },
    getUserData: async (key: string): Promise<any> => {
      try {
        const vaultId = await initializeUserVault(VaultType.USER_PROFILE);
        return await tuskyService.getData(vaultId, key);
      } catch (error) {
        return null;
      }
    },
    storeBettingHistory: async (betId: string, betData: any): Promise<boolean> => {
      const vaultId = await initializeUserVault(VaultType.BETTING_HISTORY);
      return tuskyService.storeData(vaultId, betId, betData);
    },
    getBettingHistory: async (): Promise<any[]> => {
      try {
        const vaultId = await initializeUserVault(VaultType.BETTING_HISTORY);
        // This would need to be implemented to retrieve all bet records
        // For now, we're returning a placeholder
        return [];
      } catch (error) {
        return [];
      }
    },
    isConnected
  };
}