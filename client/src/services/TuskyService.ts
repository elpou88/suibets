/**
 * TuskyService provides integration with Tusky.io decentralized storage on the SUI blockchain
 * 
 * This service handles vault management, file upload/download, and blockchain
 * storage interactions through the Tusky.io API.
 */

import { apiRequest } from '@/lib/queryClient';

// Types for Tusky storage
export interface TuskyVault {
  id: string;
  name: string;
  owner: string;
  created: string;
  size: number;
  files: TuskyFile[];
}

export interface TuskyFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploaded: string;
  url: string;
  hash: string;
}

export interface CreateVaultParams {
  name: string;
  walletAddress: string;
}

export interface UploadFileParams {
  vaultId: string;
  file: File;
  walletAddress: string;
}

// TuskyService class for interacting with Tusky.io
class TuskyService {
  private baseUrl = '/api/tusky';
  
  /**
   * Get all vaults for a wallet address
   */
  async getVaults(walletAddress: string): Promise<TuskyVault[]> {
    try {
      const response = await apiRequest('GET', `${this.baseUrl}/vaults/${walletAddress}`);
      
      // For demo environment, return mock data
      if (walletAddress.startsWith('0x7777777')) {
        return this.getMockVaults();
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Tusky vaults:', error);
      return [];
    }
  }
  
  /**
   * Create a new vault
   */
  async createVault(params: CreateVaultParams): Promise<TuskyVault | null> {
    try {
      const response = await apiRequest('POST', `${this.baseUrl}/vaults`, params);
      
      // For demo environment, return mock data
      if (params.walletAddress.startsWith('0x7777777')) {
        const mockVaults = this.getMockVaults();
        const newVault: TuskyVault = {
          id: `vault-${Date.now()}`,
          name: params.name,
          owner: params.walletAddress,
          created: new Date().toISOString(),
          size: 0,
          files: []
        };
        mockVaults.push(newVault);
        return newVault;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating Tusky vault:', error);
      return null;
    }
  }
  
  /**
   * Delete a vault
   */
  async deleteVault(vaultId: string, walletAddress: string): Promise<boolean> {
    try {
      await apiRequest('DELETE', `${this.baseUrl}/vaults/${vaultId}`, { walletAddress });
      return true;
    } catch (error) {
      console.error('Error deleting Tusky vault:', error);
      return false;
    }
  }
  
  /**
   * Upload a file to a vault
   */
  async uploadFile(params: UploadFileParams): Promise<TuskyFile | null> {
    try {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('walletAddress', params.walletAddress);
      
      const response = await fetch(`${this.baseUrl}/vaults/${params.vaultId}/files`, {
        method: 'POST',
        body: formData
      });
      
      // For demo environment, return mock data
      if (params.walletAddress.startsWith('0x7777777')) {
        return {
          id: `file-${Date.now()}`,
          name: params.file.name,
          size: params.file.size,
          type: params.file.type,
          uploaded: new Date().toISOString(),
          url: URL.createObjectURL(params.file),
          hash: `0x${Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')}`
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading file to Tusky vault:', error);
      return null;
    }
  }
  
  /**
   * Delete a file from a vault
   */
  async deleteFile(vaultId: string, fileId: string, walletAddress: string): Promise<boolean> {
    try {
      await apiRequest('DELETE', `${this.baseUrl}/vaults/${vaultId}/files/${fileId}`, { walletAddress });
      return true;
    } catch (error) {
      console.error('Error deleting file from Tusky vault:', error);
      return false;
    }
  }
  
  /**
   * Get mock vaults for demo/testing environment
   * @private
   */
  private getMockVaults(): TuskyVault[] {
    return [
      {
        id: 'vault-001',
        name: 'Betting Stats',
        owner: '0x7777777752e81f5deb48ba74ad0d58d82f952a9bbf63a3829a9c935b1f41c2bb',
        created: '2023-07-15T14:30:00Z',
        size: 1024 * 1024 * 5, // 5MB
        files: [
          {
            id: 'file-001',
            name: 'bet-history.json',
            size: 1024 * 512, // 512KB
            type: 'application/json',
            uploaded: '2023-07-15T15:00:00Z',
            url: 'https://example.com/files/bet-history.json',
            hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t'
          },
          {
            id: 'file-002',
            name: 'winning-strategy.pdf',
            size: 1024 * 1024 * 3, // 3MB
            type: 'application/pdf',
            uploaded: '2023-07-16T10:20:00Z',
            url: 'https://example.com/files/winning-strategy.pdf',
            hash: '0x9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a'
          }
        ]
      },
      {
        id: 'vault-002',
        name: 'Football Research',
        owner: '0x7777777752e81f5deb48ba74ad0d58d82f952a9bbf63a3829a9c935b1f41c2bb',
        created: '2023-08-01T09:45:00Z',
        size: 1024 * 1024 * 10, // 10MB
        files: [
          {
            id: 'file-003',
            name: 'premier-league-stats.csv',
            size: 1024 * 1024, // 1MB
            type: 'text/csv',
            uploaded: '2023-08-01T10:00:00Z',
            url: 'https://example.com/files/premier-league-stats.csv',
            hash: '0xabcdef1234567890abcdef1234567890abcdef12'
          }
        ]
      }
    ];
  }
}

// Export a singleton instance
export const tuskyService = new TuskyService();