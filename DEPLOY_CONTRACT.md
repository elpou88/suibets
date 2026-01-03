# SuiBets Contract Deployment Guide

## Prerequisites
1. Install Sui CLI: `cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui`
2. Create wallet: `sui client new-address ed25519`
3. Fund wallet with SUI for gas (minimum 1 SUI)

## Deployment Steps

### 1. Download the contract files
Copy these files to your local machine:
- `Move.toml`
- `sources/betting.move`

### 2. Build the contract
```bash
sui move build
```

### 3. Deploy to mainnet
```bash
sui client publish --gas-budget 100000000
```

### 4. Record the output
After deployment, you'll get:
- **Package ID**: The new contract address (e.g., `0x...`)
- **Platform Object ID**: Look for the created `BettingPlatform` object

Example output:
```
Published Objects:
- Package: 0xNEW_PACKAGE_ID
Created Objects:
- ID: 0xNEW_PLATFORM_ID, Owner: Shared, Type: ...::betting::BettingPlatform
```

### 5. Update environment variables
Add these to your Replit secrets:
```
BETTING_PACKAGE_ID=0xNEW_PACKAGE_ID
BETTING_PLATFORM_ID=0xNEW_PLATFORM_ID
VITE_BETTING_PACKAGE_ID=0xNEW_PACKAGE_ID
VITE_BETTING_PLATFORM_ID=0xNEW_PLATFORM_ID
```

## Contract Functions

| Function | Description | Who Can Call |
|----------|-------------|--------------|
| `place_bet` | Place a bet with SUI | Any user |
| `settle_bet` | Settle bet (win/lose) | Admin/Oracle |
| `void_bet` | Void bet (refund) | Admin/Oracle |
| `withdraw_fees` | Extract revenue | Admin only |
| `deposit_liquidity` | Add funds to treasury | Admin only |
| `add_oracle` | Authorize settlement oracle | Admin only |
| `set_pause` | Pause/unpause platform | Admin only |
| `update_fee` | Change platform fee | Admin only |
| `update_limits` | Change min/max bet | Admin only |

## After Deployment

1. Add the admin wallet as oracle:
```bash
sui client call --package 0xNEW_PACKAGE_ID --module betting --function add_oracle \
  --args 0xNEW_PLATFORM_ID 0xADMIN_WALLET_ADDRESS --gas-budget 10000000
```

2. Deposit initial liquidity:
```bash
sui client call --package 0xNEW_PACKAGE_ID --module betting --function deposit_liquidity \
  --args 0xNEW_PLATFORM_ID 0xCOIN_OBJECT_ID 0x6 --gas-budget 10000000
```

## Revenue Withdrawal

To withdraw accumulated fees (lost bets + win fees):
```bash
sui client call --package 0xNEW_PACKAGE_ID --module betting --function withdraw_fees \
  --args 0xNEW_PLATFORM_ID AMOUNT_IN_MIST 0x6 --gas-budget 10000000
```

Or use the API endpoint: `POST /api/admin/withdraw-fees` with body `{ "amount": 10.5 }` (in SUI)
