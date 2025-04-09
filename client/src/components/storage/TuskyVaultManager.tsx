import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWalletAdapter } from '@/components/wallet/WalletAdapter';
import { tuskyService, TuskyVault, TuskyFile } from '@/services/TuskyService';
import { 
  Trash2, 
  FolderPlus, 
  Upload, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * TuskyVaultManager component for managing decentralized storage vaults
 * 
 * This component provides a UI for creating, viewing, and managing storage
 * vaults on the Tusky.io decentralized storage platform.
 */
const TuskyVaultManager: React.FC = () => {
  const { address, isConnected } = useWalletAdapter();
  const { toast } = useToast();
  
  const [vaults, setVaults] = useState<TuskyVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [openVaultId, setOpenVaultId] = useState<string | null>(null);
  const [createVaultOpen, setCreateVaultOpen] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Fetch vaults for the connected wallet
  useEffect(() => {
    const loadVaults = async () => {
      if (isConnected && address) {
        setLoading(true);
        try {
          const userVaults = await tuskyService.getVaults(address);
          setVaults(userVaults);
        } catch (error) {
          console.error('Error loading vaults:', error);
          toast({
            title: 'Failed to load vaults',
            description: 'Could not retrieve your storage vaults',
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadVaults();
  }, [address, isConnected, toast]);
  
  // Create a new vault
  const handleCreateVault = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to create a vault',
        variant: 'destructive'
      });
      return;
    }
    
    if (!newVaultName.trim()) {
      toast({
        title: 'Invalid vault name',
        description: 'Please enter a valid name for your vault',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const newVault = await tuskyService.createVault({
        name: newVaultName,
        walletAddress: address
      });
      
      if (newVault) {
        setVaults(prev => [...prev, newVault]);
        setCreateVaultOpen(false);
        setNewVaultName('');
        
        toast({
          title: 'Vault created',
          description: `Your vault '${newVault.name}' has been created successfully`,
        });
      }
    } catch (error) {
      console.error('Error creating vault:', error);
      toast({
        title: 'Failed to create vault',
        description: 'An error occurred while creating your vault',
        variant: 'destructive'
      });
    }
  };
  
  // Delete a vault
  const handleDeleteVault = async (vaultId: string) => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to delete a vault',
        variant: 'destructive'
      });
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this vault? This action cannot be undone.')) {
      return;
    }
    
    try {
      const success = await tuskyService.deleteVault(vaultId, address);
      
      if (success) {
        setVaults(prev => prev.filter(vault => vault.id !== vaultId));
        
        toast({
          title: 'Vault deleted',
          description: 'Your vault has been deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting vault:', error);
      toast({
        title: 'Failed to delete vault',
        description: 'An error occurred while deleting your vault',
        variant: 'destructive'
      });
    }
  };
  
  // Upload a file to a vault
  const handleUploadFile = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to upload a file',
        variant: 'destructive'
      });
      return;
    }
    
    if (!selectedVaultId) {
      toast({
        title: 'No vault selected',
        description: 'Please select a vault to upload to',
        variant: 'destructive'
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const uploadedFile = await tuskyService.uploadFile({
        vaultId: selectedVaultId,
        file: selectedFile,
        walletAddress: address
      });
      
      if (uploadedFile) {
        // Update the vaults list with the new file
        setVaults(prev => prev.map(vault => {
          if (vault.id === selectedVaultId) {
            return {
              ...vault,
              files: [...vault.files, uploadedFile],
              size: vault.size + uploadedFile.size
            };
          }
          return vault;
        }));
        
        setUploadDialogOpen(false);
        setSelectedFile(null);
        
        toast({
          title: 'File uploaded',
          description: `Your file '${uploadedFile.name}' has been uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Failed to upload file',
        description: 'An error occurred while uploading your file',
        variant: 'destructive'
      });
    }
  };
  
  // Delete a file from a vault
  const handleDeleteFile = async (vaultId: string, fileId: string, fileName: string) => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to delete a file',
        variant: 'destructive'
      });
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete the file '${fileName}'? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const success = await tuskyService.deleteFile(vaultId, fileId, address);
      
      if (success) {
        // Update the vaults list without the deleted file
        setVaults(prev => prev.map(vault => {
          if (vault.id === vaultId) {
            const fileToRemove = vault.files.find(f => f.id === fileId);
            return {
              ...vault,
              files: vault.files.filter(f => f.id !== fileId),
              size: vault.size - (fileToRemove?.size || 0)
            };
          }
          return vault;
        }));
        
        toast({
          title: 'File deleted',
          description: `The file '${fileName}' has been deleted successfully`,
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Failed to delete file',
        description: 'An error occurred while deleting your file',
        variant: 'destructive'
      });
    }
  };
  
  // Format file size for display
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return sizeInBytes + ' B';
    } else if (sizeInBytes < 1024 * 1024) {
      return (sizeInBytes / 1024).toFixed(2) + ' KB';
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      return (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
  };

  // Display message if wallet is not connected
  if (!isConnected || !address) {
    return (
      <Card className="border-[#1e3a3f] bg-[#0b1618] text-white">
        <CardHeader>
          <CardTitle>Storage Vaults</CardTitle>
          <CardDescription className="text-gray-400">Tusky.io decentralized storage</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p>Please connect your wallet to access your storage vaults</p>
        </CardContent>
      </Card>
    );
  }

  // Display loading state
  if (loading) {
    return (
      <Card className="border-[#1e3a3f] bg-[#0b1618] text-white">
        <CardHeader>
          <CardTitle>Storage Vaults</CardTitle>
          <CardDescription className="text-gray-400">Loading your vaults...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#00FFFF] border-solid"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Storage Vaults</h2>
        <Button 
          onClick={() => setCreateVaultOpen(true)}
          className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Create Vault
        </Button>
      </div>
      
      {vaults.length === 0 ? (
        <Card className="border-[#1e3a3f] bg-[#0b1618] text-white">
          <CardContent className="text-center py-8">
            <p>You don't have any storage vaults yet. Create one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vaults.map(vault => (
            <Card key={vault.id} className="border-[#1e3a3f] bg-[#0b1618] text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>{vault.name}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-200/10"
                    onClick={() => handleDeleteVault(vault.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                <CardDescription className="text-gray-400">
                  Created: {new Date(vault.created).toLocaleDateString()} • Size: {formatFileSize(vault.size)}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full border-[#1e3a3f] text-[#00FFFF] hover:bg-[#1e3a3f]/30"
                  onClick={() => {
                    setSelectedVaultId(vault.id);
                    setUploadDialogOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                
                <div className="mt-4">
                  <Accordion type="single" collapsible>
                    <AccordionItem value={vault.id} className="border-[#1e3a3f]">
                      <AccordionTrigger className="text-[#00FFFF]">
                        Files ({vault.files.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        {vault.files.length === 0 ? (
                          <p className="text-gray-400 py-2">No files in this vault yet</p>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {vault.files.map(file => (
                              <div 
                                key={file.id} 
                                className="flex items-center justify-between bg-[#112225] p-3 rounded-md"
                              >
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 mr-3 text-[#00FFFF]" />
                                  <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-gray-400">
                                      {formatFileSize(file.size)} • {new Date(file.uploaded).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-[#00FFFF] hover:bg-[#1e3a3f]/30"
                                    onClick={() => window.open(file.url, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-200/10"
                                    onClick={() => handleDeleteFile(vault.id, file.id, file.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create Vault Dialog */}
      <Dialog open={createVaultOpen} onOpenChange={setCreateVaultOpen}>
        <DialogContent className="bg-[#0b1618] text-white border-[#1e3a3f]">
          <DialogHeader>
            <DialogTitle>Create New Vault</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new decentralized storage vault on the Sui blockchain
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
                className="bg-[#112225] border-[#1e3a3f] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateVaultOpen(false)}
              className="border-[#1e3a3f] text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateVault}
              className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black"
            >
              Create Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload File Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-[#0b1618] text-white border-[#1e3a3f]">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload a file to your decentralized storage vault
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <Input 
                id="file-upload"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="bg-[#112225] border-[#1e3a3f] text-white"
              />
              {selectedFile && (
                <p className="text-sm text-gray-400">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
              }}
              className="border-[#1e3a3f] text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadFile}
              disabled={!selectedFile}
              className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black"
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TuskyVaultManager;