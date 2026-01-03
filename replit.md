# SuiBets Platform - Crypto Sports Betting Platform

## Overview
SuiBets is a crypto sports betting platform built on the Sui blockchain, offering real-time betting across 30+ sports. It integrates multiple sports APIs for live scores and automated event tracking, utilizing blockchain for secure transactions and PostgreSQL for data persistence. The platform aims to provide a comprehensive and robust betting experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (custom themed)
- **Animations**: Framer Motion
- **UI Components**: Radix UI
- **Data Fetching**: TanStack Query
- **Routing**: Wouter

### Backend
- **Framework**: Express.js with TypeScript
- **API**: RESTful design with sport-specific modules
- **Real-time**: WebSocket for live score updates
- **Data Aggregation**: Multi-API with resilience and fallback
- **Authentication**: Session-based with optional blockchain authentication

### Data Storage
- **Primary Database**: PostgreSQL with Drizzle ORM (Railway hosted)
- **Caching**: In-memory for performance
- **Authentication State**: Session storage

### Key Features
- **Sports Data Integration**: Aggregates data from API-Sports and SportsData API across various sports with an event tracking service and API resilience.
- **Blockchain Integration**: Utilizes the Sui blockchain for secure transactions, supports SBETS token, and employs Move smart contracts for betting operations, with multiple wallet support.
- **Betting System**: Provides real-time odds, multiple market types, live betting via WebSockets, betting slip management, and automated payout through smart contracts.
- **User Management**: Features wallet-based authentication, user profiles, balance management for SUI and SBETS tokens, and secure session handling.

### Data Flow
- **Event Data Pipeline**: Involves data aggregation, normalization, event tracking, real-time updates via WebSocket, and caching.
- **Betting Flow (On-Chain)**: Users select markets, odds are calculated, bets are placed via Sui smart contracts (user signs `place_bet` transaction), confirmed transactions are recorded in PostgreSQL, and settlements are automated.
- **Authentication Flow**: Wallet connection, address verification, session creation, balance synchronization from blockchain, and transaction authorization.

### Architecture Model
- **Hybrid Custodial Model**: Users deposit SUI/SBETS to the platform treasury wallet. Bets are tracked in PostgreSQL, and settlements are processed off-chain. Withdrawals can be automated or manual.
  - **Treasury Wallet**: `0x20850db591c4d575b5238baf975e54580d800e69b8b5b421de796a311d3bea50`
  - **Admin Wallet**: `0x747c44940ec9f0136e3accdd81f37d5b3cc1d62d7747968d633cabb6aa5aa45f`

#### Fund Flow - DUAL SETTLEMENT SYSTEM

**SUI Bets (On-Chain via Smart Contract):**
1. **User places bet** → SUI goes directly to contract treasury
2. **If Bet WON** → `settle_bet` pays user from contract treasury (1% fee on profit)
3. **If Bet LOST** → Stake stays in contract treasury (added to `accrued_fees`)
4. **Admin can** → Call `withdraw_fees` to withdraw platform revenue

**SBETS Bets (Off-Chain Hybrid Model):**
1. **User deposits** → SBETS transferred to treasury wallet → internal balance credited
2. **Bet Placement** → Internal balance deducted
3. **If Bet LOST** → Stake stays in treasury → recorded as database revenue
4. **If Bet WON** → Winnings credited to internal balance → user can withdraw
5. **Withdrawal** → Admin keypair signs transfer from treasury to user

- **Key Point**: SUI uses smart contract for settlements (full on-chain). SBETS uses hybrid custodial model (off-chain tracking).
- **Gas Payment**: Users pay gas for deposits/bets. Platform pays gas for on-chain settlements and withdrawals.

### Monitoring Endpoints
- `/api/contract/info`: Provides blockchain contract details.
- `/api/settlement/status`: Reports on the settlement worker's status.
- `/api/user/balance?userId=<wallet>`: Fetches user SUI and SBETS balances.

### Deployment Strategy
- **Railway Deployment**: Recommended, requires specific environment variables for database, blockchain configuration, on-chain payouts (optional `ADMIN_PRIVATE_KEY` for automated withdrawals), sports data, and session security.
- **Vercel Compatibility**: Alternative for serverless functions and static asset optimization.
- **Configuration Management**: Uses environment variables for secrets, network configuration, fee structure, and wallet addresses.

## External Dependencies

### Sports Data Providers
- **API-Sports**: Primary sports data provider (`api-sports.io`).
- **SportsData API**: Secondary data source.
- **Fixed API Key**: `3ec255b133882788e32f6349eff77b21`

### Blockchain Services
- **Sui Network**: Layer 1 blockchain (mainnet).
- **Move Language**: For smart contract development.
- **Contract Source**: `sources/betting.move` (full-featured contract ready for deployment)
- **Deployed Contract (Mainnet)** - NEEDS REDEPLOYMENT with full contract:
    - Current Package ID: `0xf8209567df9e80789ec7036f747d6386a8935b50f065e955a715e364f4f893aa` (legacy - missing functions)
    - Platform Object ID: `0x5fe75eab8aef1c209e0d2b8d53cd601d4efaf22511e82d8504b0f7f6c754df89`
    - Admin Wallet: `0x747c44940ec9f0136e3accdd81f37d5b3cc1d62d7747968d633cabb6aa5aa45f`
    - Module: `betting`
- **Full Contract Functions**:
    - `place_bet` - Place bet with SUI (user callable)
    - `settle_bet` - Settle bet win/lose (admin/oracle)
    - `void_bet` - Void and refund bet (admin/oracle)
    - `withdraw_fees` - Extract platform revenue (admin only)
    - `deposit_liquidity` - Add treasury funds (admin only)
    - `add_oracle` / `remove_oracle` - Manage oracles (admin only)
    - `set_pause` - Pause/unpause platform (admin only)
    - `update_fee` - Change fee percentage (admin only)
    - `update_limits` - Change min/max bet (admin only)
- **Deployment Guide**: See `DEPLOY_CONTRACT.md` for deployment instructions
- **Environment Variables** (update after deployment):
    - `BETTING_PACKAGE_ID` / `VITE_BETTING_PACKAGE_ID` - New package ID
    - `BETTING_PLATFORM_ID` / `VITE_BETTING_PLATFORM_ID` - New platform object ID

### Payment Integration
- **Stripe**: Optional fiat payment processing.
- **Native Crypto**: Preferred direct blockchain transactions.

### Infrastructure
- **PostgreSQL**: Primary database.
- **WebSocket**: Real-time communication.
- **Session Store**: User session management.