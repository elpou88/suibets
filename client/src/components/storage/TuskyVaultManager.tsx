import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTuskyStorage, VaultType } from '@/services/TuskyService';
import { useWalletAdapter } from '@/components/wallet/WalletAdapter';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink, Database, Shield } from 'lucide-react';

/**
 * TuskyVaultManager Component
 * 
 * Provides UI to manage Tusky vaults for a user. Allows users to:
 * - View existing vaults
 * - Create new vaults
 * - Store and retrieve data
 */
export function TuskyVaultManager() {
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [userProfileVaultId, setUserProfileVaultId] = useState<string | null>(null);
  const [bettingHistoryVaultId, setBettingHistoryVaultId] = useState<string | null>(null);
  const [stakingDataVaultId, setStakingDataVaultId] = useState<string | null>(null);
  
  const { address, isConnected } = useWalletAdapter();
  const { tuskyService, initializeUserVault } = useTuskyStorage();
  const { toast } = useToast();
  
  // Function to load user vaults
  const loadVaults = async () => {
    if (!isConnected || !address) {
      return;
    }
    
    setLoading(true);
    try {
      const userVaults = await tuskyService.getVaults();
      setVaults(userVaults);
      
      // Set specific vault IDs if they exist
      const profileVault = userVaults.find(v => 
        v.metadata && v.metadata.type === VaultType.USER_PROFILE
      );
      if (profileVault) setUserProfileVaultId(profileVault.id);
      
      const historyVault = userVaults.find(v => 
        v.metadata && v.metadata.type === VaultType.BETTING_HISTORY
      );
      if (historyVault) setBettingHistoryVaultId(historyVault.id);
      
      const stakingVault = userVaults.find(v => 
        v.metadata && v.metadata.type === VaultType.STAKING_DATA
      );
      if (stakingVault) setStakingDataVaultId(stakingVault.id);
      
    } catch (error) {
      console.error('Error loading vaults:', error);
      toast({
        title: 'Failed to Load Vaults',
        description: 'Could not retrieve your Tusky vaults. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to initialize all necessary vaults
  const initializeAllVaults = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create storage vaults.',
        variant: 'destructive',
      });
      return;
    }
    
    setCreating(true);
    try {
      // Initialize user profile vault
      if (!userProfileVaultId) {
        const profileVaultId = await initializeUserVault(VaultType.USER_PROFILE);
        setUserProfileVaultId(profileVaultId);
      }
      
      // Initialize betting history vault
      if (!bettingHistoryVaultId) {
        const historyVaultId = await initializeUserVault(VaultType.BETTING_HISTORY);
        setBettingHistoryVaultId(historyVaultId);
      }
      
      // Initialize staking data vault
      if (!stakingDataVaultId) {
        const stakingVaultId = await initializeUserVault(VaultType.STAKING_DATA);
        setStakingDataVaultId(stakingVaultId);
      }
      
      // Reload vaults to reflect changes
      await loadVaults();
      
      toast({
        title: 'Vaults Created',
        description: 'Your storage vaults have been initialized successfully.',
      });
    } catch (error) {
      console.error('Error initializing vaults:', error);
      toast({
        title: 'Vault Creation Failed',
        description: 'There was an error creating your storage vaults. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };
  
  // Load vaults on component mount or when wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      loadVaults();
    }
  }, [isConnected, address]);
  
  // Function to open the vault in Tusky web UI
  const openVaultInTusky = (vaultId: string) => {
    window.open(tuskyService.getVaultUrl(vaultId), '_blank');
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-[#00FFFF]">
          <Database className="mr-2 h-6 w-6" />
          Tusky Decentralized Storage
        </CardTitle>
        <CardDescription>
          Manage your decentralized storage vaults powered by Tusky.io
        </CardDescription>
      </CardHeader>
      
      <Separator className="mb-4" />
      
      <CardContent>
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Shield className="h-12 w-12 text-gray-500 mb-4" />
            <p className="text-center text-gray-500 mb-4">
              Connect your wallet to access your decentralized storage vaults
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00FFFF]" />
          </div>
        ) : vaults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Database className="h-12 w-12 text-gray-500 mb-4" />
            <p className="text-center text-gray-500 mb-4">
              No storage vaults found. Create vaults to store your data securely.
            </p>
            <Button 
              variant="default" 
              onClick={initializeAllVaults}
              disabled={creating}
              className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initialize Storage Vaults
            </Button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium mb-4">Your Storage Vaults</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProfileVaultId && (
                <Card className="bg-[#112225]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-[#00FFFF]">User Profile Vault</CardTitle>
                    <CardDescription>Stores your personal settings and preferences</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2 flex justify-between">
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">
                      ID: {userProfileVaultId}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                      onClick={() => openVaultInTusky(userProfileVaultId)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> View
                    </Button>
                  </CardFooter>
                </Card>
              )}
              
              {bettingHistoryVaultId && (
                <Card className="bg-[#112225]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-[#00FFFF]">Betting History Vault</CardTitle>
                    <CardDescription>Securely stores your betting history</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2 flex justify-between">
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">
                      ID: {bettingHistoryVaultId}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                      onClick={() => openVaultInTusky(bettingHistoryVaultId)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> View
                    </Button>
                  </CardFooter>
                </Card>
              )}
              
              {stakingDataVaultId && (
                <Card className="bg-[#112225]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-[#00FFFF]">Staking Data Vault</CardTitle>
                    <CardDescription>Tracks your staking positions and rewards</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2 flex justify-between">
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">
                      ID: {stakingDataVaultId}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                      onClick={() => openVaultInTusky(stakingDataVaultId)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> View
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
            
            {vaults.length > 0 && !userProfileVaultId && !bettingHistoryVaultId && !stakingDataVaultId && (
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="default" 
                  onClick={initializeAllVaults}
                  disabled={creating}
                  className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
                >
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Initialize Missing Vaults
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={loadVaults}
          disabled={loading || !isConnected}
        >
          Refresh
        </Button>
        
        <Button 
          variant="default"
          className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
          onClick={() => window.open('https://app.tusky.io/vaults', '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Visit Tusky.io
        </Button>
      </CardFooter>
    </Card>
  );
}