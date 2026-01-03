# SuiBets Contract Deployment Guide

## Prerequisites
1. Install Sui CLI: `cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui`
2. Create wallet: `sui client new-address ed25519`
3. Fund wallet with SUI for gas (minimum 1 SUI)

## Contract Features

### Dual Token Support
- **SUI betting**: Users can bet with native SUI tokens
- **SBETS betting**: Users can bet with SBETS platform tokens
- Separate treasuries and liability tracking for each token type

### Contract Functions

| Function | Description | Who Can Call |
|----------|-------------|--------------|
| **SUI Functions** | | |
| `place_bet` | Place a bet with SUI | Any user |
| `settle_bet` | Settle SUI bet (win/lose) | Admin/Oracle |
| `void_bet` | Void SUI bet (refund) | Admin/Oracle |
| `withdraw_fees` | Extract SUI revenue | Admin only |
| `deposit_liquidity` | Add SUI to treasury | Admin only |
| **SBETS Functions** | | |
| `place_bet_sbets` | Place a bet with SBETS | Any user |
| `settle_bet_sbets` | Settle SBETS bet (win/lose) | Admin/Oracle |
| `void_bet_sbets` | Void SBETS bet (refund) | Admin/Oracle |
| `withdraw_fees_sbets` | Extract SBETS revenue | Admin only |
| `deposit_liquidity_sbets` | Add SBETS to treasury | Admin only |
| **Admin Functions** | | |
| `add_oracle` | Authorize settlement oracle | Admin only |
| `remove_oracle` | Remove oracle | Admin only |
| `set_pause` | Pause/unpause platform | Admin only |
| `update_fee` | Change platform fee | Admin only |
| `update_limits` | Change min/max bet | Admin only |
| `propose_admin` | Start admin transfer | Admin only |
| `accept_admin` | Accept admin role | Pending admin |
| `emergency_withdraw` | Emergency SUI withdrawal | Admin (paused) |
| `emergency_withdraw_sbets` | Emergency SBETS withdrawal | Admin (paused) |

## Deployment Steps

### 1. Create project folder with these files:
```
suibets/
├── Move.toml
└── sources/
    └── betting.move
```

### 2. Move.toml content:
```toml
[package]
name = "suibets"
version = "1.0.0"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/mainnet" }

[addresses]
suibets = "0x0"
sbets_token = "0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285"
```

**Note:** The contract imports the existing SBETS token from mainnet at `0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS`

### 3. Build the contract
```bash
cd suibets
sui move build
```

### 4. Deploy to mainnet
```bash
sui client publish --gas-budget 100000000
```

### 5. Record the output
After deployment, you'll get:
- **Package ID**: The new contract address
- **BettingPlatform Object ID**: The shared platform object
Example output:
```
Published Objects:
- Package: 0xNEW_PACKAGE_ID
Created Objects:
- ID: 0xNEW_PLATFORM_ID, Owner: Shared, Type: ...::betting::BettingPlatform
```

### 6. Update environment variables in Replit secrets:
```
BETTING_PACKAGE_ID=0xNEW_PACKAGE_ID
BETTING_PLATFORM_ID=0xNEW_PLATFORM_ID
VITE_BETTING_PACKAGE_ID=0xNEW_PACKAGE_ID
VITE_BETTING_PLATFORM_ID=0xNEW_PLATFORM_ID
SBETS_TOKEN_ADDRESS=0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS
```

## Post-Deployment Setup

### 1. Add admin wallet as oracle:
```bash
sui client call --package 0xNEW_PACKAGE_ID --module betting --function add_oracle \
  --args 0xNEW_PLATFORM_ID 0xADMIN_WALLET_ADDRESS --gas-budget 10000000
```

### 2. Deposit initial SUI liquidity:
```bash
sui client call --package 0xNEW_PACKAGE_ID --module betting --function deposit_liquidity \
  --args 0xNEW_PLATFORM_ID 0xYOUR_SUI_COIN_ID 0x6 --gas-budget 10000000
```

### 3. Deposit initial SBETS liquidity:
To pay out SBETS winners, you need SBETS tokens in the contract treasury.
Get your SBETS coin object ID first: `sui client coins --coin-type 0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS`
```bash
sui client call --package 0xNEW_PACKAGE_ID --module betting --function deposit_liquidity_sbets \
  --args 0xNEW_PLATFORM_ID 0xYOUR_SBETS_COIN_ID 0x6 --gas-budget 10000000
```

## Revenue Withdrawal

### Withdraw SUI fees:
```bash
sui client call --package 0xNEW_PACKAGE_ID --module betting --function withdraw_fees \
  --args 0xNEW_PLATFORM_ID AMOUNT_IN_MIST 0x6 --gas-budget 10000000
```

### Withdraw SBETS fees:
```bash
sui client call --package 0xNEW_PACKAGE_ID --module betting --function withdraw_fees_sbets \
  --args 0xNEW_PLATFORM_ID AMOUNT_IN_MIST 0x6 --gas-budget 10000000
```

## Coin Type Constants
- SUI bets: `coin_type = 0`
- SBETS bets: `coin_type = 1`

## Fee Model
- 1% fee on **profit only** (not on stake)
- Lost stakes become platform revenue
- Fees accumulate in `accrued_fees_sui` and `accrued_fees_sbets`

## Solvency Guarantees
- Treasury always maintains enough to cover pending bet payouts
- `withdraw_fees` can only extract surplus above liabilities
- Emergency withdrawal requires platform to be paused
