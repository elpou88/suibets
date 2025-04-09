import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTuskyStorage, VaultType, VaultMetadata } from '@/services/TuskyService';
import { useWalletAdapter } from '@/components/wallet/WalletAdapter';
import { useToast } from '@/hooks/use-toast';
import { Database, Trash2, Clock, HardDrive, Plus, RefreshCw, LockKeyhole } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const TuskyVaultManager: React.FC = () => {
  const { vaults, isLoading, createVault, deleteVault, refetchVaults } = useTuskyStorage();
  const { address, isConnected } = useWalletAdapter();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultMetadata | null>(null);
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultType, setNewVaultType] = useState<VaultType>(VaultType.CUSTOM);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Function to handle creating a new vault
  const handleCreateVault = async () => {
    if (!newVaultName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a vault name',
        variant: 'destructive',
      });
      return;
    }
    
    if (!newVaultType) {
      toast({
        title: 'Validation Error',
        description: 'Please select a vault type',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsCreating(true);
      await createVault(newVaultName, newVaultType);
      
      toast({
        title: 'Vault Created',
        description: `Successfully created vault "${newVaultName}"`,
      });
      
      // Reset form and close dialog
      setNewVaultName('');
      setNewVaultType(VaultType.CUSTOM);
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create vault',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Function to handle deleting a vault
  const handleDeleteVault = async () => {
    if (!selectedVault) return;
    
    try {
      setIsDeleting(true);
      await deleteVault(selectedVault.id);
      
      toast({
        title: 'Vault Deleted',
        description: `Successfully deleted vault "${selectedVault.name}"`,
      });
      
      // Reset selected vault and close dialog
      setSelectedVault(null);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete vault',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Function to get icon for vault type
  const getVaultIcon = (type: VaultType) => {
    switch (type) {
      case VaultType.PROFILE:
        return <Database className="h-4 w-4 text-blue-500" />;
      case VaultType.BETTING_HISTORY:
        return <Clock className="h-4 w-4 text-green-500" />;
      case VaultType.PREFERENCES:
        return <HardDrive className="h-4 w-4 text-purple-500" />;
      case VaultType.CUSTOM:
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };
  
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Please connect your wallet to manage storage vaults</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <LockKeyhole className="h-16 w-16 mx-auto text-gray-400" />
            <p>Wallet connection required to access your Tusky storage vaults</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#00FFFF]">Your Storage Vaults</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchVaults()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Vault
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="w-full flex justify-center items-center p-12">
          <div className="animate-spin w-8 h-8 border-4 border-[#00FFFF] border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaults && vaults.length > 0 ? (
            vaults.map((vault) => (
              <Card key={vault.id} className="bg-[#112225] border border-[#1e3a3f]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getVaultIcon(vault.type)}
                      <CardTitle className="ml-2 text-base">{vault.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => {
                        setSelectedVault(vault);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">{vault.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Size:</span>
                      <span>{formatFileSize(vault.size)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Last Modified:</span>
                      <span>{formatDistanceToNow(new Date(vault.lastModified), { addSuffix: true })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Created:</span>
                      <span>{formatDistanceToNow(new Date(vault.created), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    className="w-full bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
                  >
                    Manage Data
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 text-center border rounded-md border-dashed border-gray-600 bg-[#0b1618]">
              <Database className="h-10 w-10 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#00FFFF] mb-2">No Storage Vaults Found</h3>
              <p className="text-gray-400 mb-4">
                Create your first Tusky storage vault to securely store your betting data on the Sui blockchain
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Vault
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Create Vault Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Storage Vault</DialogTitle>
            <DialogDescription>
              Create a new secure storage vault on the Tusky network
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vault-name">Vault Name</Label>
              <Input
                id="vault-name"
                placeholder="My Vault"
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vault-type">Vault Type</Label>
              <Select
                value={newVaultType}
                onValueChange={(value) => setNewVaultType(value as VaultType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vault type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VaultType.PROFILE}>Profile Data</SelectItem>
                  <SelectItem value={VaultType.BETTING_HISTORY}>Betting History</SelectItem>
                  <SelectItem value={VaultType.PREFERENCES}>User Preferences</SelectItem>
                  <SelectItem value={VaultType.CUSTOM}>Custom Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateVault}
              disabled={isCreating}
              className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
            >
              {isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-black" />
                  Creating...
                </>
              ) : (
                'Create Vault'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Vault Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Storage Vault</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vault? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVault && (
            <div className="py-4">
              <Card className="bg-[#112225] border border-[#1e3a3f]">
                <CardHeader className="py-2">
                  <div className="flex items-center">
                    {getVaultIcon(selectedVault.type)}
                    <CardTitle className="ml-2 text-base">{selectedVault.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm text-gray-400">{selectedVault.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Size: {formatFileSize(selectedVault.size)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVault}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete Vault'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};