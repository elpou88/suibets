# Wallet Connector Implementation Guide

To ensure the wallet connection in the top navigation bar works exactly like the whitepaper site's implementation, follow these instructions when deploying the package:

## Key Features to Implement

1. The "Connect Wallet" button in the top navigation should:
   - Use the `<Wallet />` icon from lucide-react (small size, h-4 w-4)
   - Have NO "+" sign in the button text
   - Use color scheme: bg-[#00FFFF] text-black
   - When clicked, open the wallet connection modal directly

2. The wallet connection modal should support:
   - Sui Wallet connection via dApp Kit
   - Suiet wallet connection
   - Manual wallet address input option

3. When connected, the wallet button should transform into:
   - A dropdown showing the shortened wallet address
   - Color scheme: border-[#00FFFF] bg-[#112225] text-[#00FFFF]
   - Dropdown menu with options: Wallet Dashboard, My Bets, DeFi Staking, Disconnect

## Implementation Details

### NavigationBar.tsx

```jsx
// Top section with wallet button
<div className="flex items-center">
  {/* Connect Wallet Button - no plus sign */}
  <Button 
    className="bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black font-medium" 
    onClick={attemptQuickWalletConnection}
    disabled={isAttemptingConnection}
  >
    <Wallet className="h-4 w-4 mr-2" />
    {isAttemptingConnection ? 'Connecting...' : 'Connect Wallet'}
  </Button>
</div>
```

### Connected State

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="border-[#00FFFF] bg-[#112225] text-[#00FFFF] hover:bg-[#00FFFF]/20">
      <Wallet className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">{shortenAddress(user.walletAddress)}</span>
      <span className="sm:hidden">Connected</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem 
      className="font-medium text-[#00FFFF] cursor-pointer"
      onClick={() => setLocation('/wallet-dashboard')}
    >
      Wallet Dashboard
    </DropdownMenuItem>
    <!-- Additional menu items -->
  </DropdownMenuContent>
</DropdownMenu>
```

### Wallet Connection Modal

```jsx
<ConnectWalletModal 
  isOpen={isWalletModalOpen} 
  onClose={() => setIsWalletModalOpen(false)} 
/>
```

## Important Notes

1. Do NOT use a "+" sign in the "Connect Wallet" button
2. Use the exact color scheme specified
3. Maintain the user experience flow:
   - Click "Connect Wallet" → Modal opens → Select wallet type → Complete connection
4. When connected, the wallet address should be displayed in the format: "0x1234...5678"

This implementation closely matches the whitepaper site's wallet connection experience, ensuring consistency throughout the platform.