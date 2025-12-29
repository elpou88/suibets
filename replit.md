# SuiBets Platform - Crypto Sports Betting Platform

## Overview

SuiBets is a comprehensive crypto sports betting platform built on the Sui blockchain. The platform integrates multiple sports APIs to provide real-time betting opportunities across 30+ sports, featuring automated event tracking, live score updates, and blockchain-based transactions with PostgreSQL database for data persistence.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool for fast development
- **Tailwind CSS** with custom theming for responsive design
- **Framer Motion** for smooth animations
- **Radix UI** components for accessible UI elements
- **TanStack Query** for data fetching and caching
- **Wouter** for lightweight routing

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with sport-specific service modules
- **WebSocket** integration for real-time live score updates
- **Multi-API aggregation** with resilience and fallback mechanisms
- **Session-based authentication** with optional blockchain authentication

### Data Storage Solutions
- **PostgreSQL** database with Drizzle ORM (Railway hosted)
- **In-memory caching** for frequently accessed data
- **Session storage** for user authentication state

## Key Components

### Sports Data Integration
- **API-Sports** integration for 14 core sports
- **SportsData API** as secondary data source
- **Sport-specific services** for Football, Basketball, Tennis, Baseball, Hockey, Rugby, Cricket, Golf, Boxing, MMA, Formula 1, Cycling, American Football, and others
- **Event tracking service** that monitors upcoming events and transitions them to live status
- **API resilience service** with DNS fallback and retry mechanisms

### Blockchain Integration
- **Sui blockchain** integration for secure transactions
- **SBETS token** (0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS)
- **Smart contracts** written in Move language for betting operations
- **Multiple wallet support** including Sui Wallet and Suiet

### Betting System
- **Real-time odds** calculation and display
- **Multiple market types** (Match Winner, Handicap, Over/Under, etc.)
- **Live betting** capabilities with WebSocket updates
- **Betting slip** management with parlay support
- **Automated payout** system via smart contracts

### User Management
- **Wallet-based authentication** with optional traditional auth
- **User profiles** with betting history and statistics
- **Balance management** for SUI and SBETS tokens
- **Session management** with secure cookie handling

## Data Flow

### Event Data Pipeline
1. **Data Aggregation**: Multiple sports APIs fetch live and upcoming events
2. **Data Normalization**: Standardize event data across different sports
3. **Event Tracking**: Monitor status changes from upcoming to live
4. **Real-time Updates**: WebSocket broadcasts live score updates
5. **Caching Layer**: Store frequently accessed data for performance

### Betting Flow
1. **Event Selection**: User selects betting markets from live/upcoming events
2. **Odds Calculation**: Real-time odds computation with margin application
3. **Bet Placement**: Smart contract execution on Sui blockchain
4. **Settlement**: Automated payout based on event results
5. **History Tracking**: Store bet records in database and blockchain

### Authentication Flow
1. **Wallet Connection**: User connects Sui-compatible wallet
2. **Address Verification**: Validate wallet address and signature
3. **Session Creation**: Establish authenticated session
4. **Balance Sync**: Update user balance from blockchain
5. **Transaction Authorization**: Enable betting transactions

## External Dependencies

### Sports Data Providers
- **API-Sports** - Primary sports data provider (api-sports.io)
- **SportsData API** - Secondary data source for enhanced coverage
- **Fixed API Key**: 3ec255b133882788e32f6349eff77b21 (shared across services)

### Blockchain Services
- **Sui Network** - Layer 1 blockchain for transactions
- **Walrus Protocol** - Decentralized storage solution
- **Move Language** - Smart contract development

### Payment Integration
- **Stripe** - Optional fiat payment processing (keys configurable)
- **Native Crypto** - Direct blockchain transactions preferred

### Infrastructure
- **PostgreSQL** - Relational database (optional with blockchain fallback)
- **WebSocket** - Real-time communication
- **Session Store** - User session management

## Deployment Strategy

### Walrus Deployment
- **Primary deployment target** using Walrus CLI
- **Environment configuration** via .env variables
- **Network support** for testnet and mainnet
- **Automatic scaling** based on demand

### Vercel Compatibility
- **Alternative deployment** option with Node.js runtime
- **Serverless functions** for API endpoints
- **Static asset** optimization

### Configuration Management
- **Environment variables** for API keys and secrets
- **Network configuration** (testnet/mainnet toggle)
- **Fee structure** configuration (platform, network, staking fees)
- **Wallet addresses** for deposit/withdrawal operations

## Recent Changes
- December 29, 2025: Added full on-chain betting infrastructure
  - Created Move smart contract (sui_contracts/suibets/sources/betting.move) with place_bet, settle_bet, void_bet functions
  - BlockchainBetService builds transaction payloads for frontend wallet signing
  - WalrusService supports real HTTP API calls to Walrus aggregator/publisher (set USE_REAL_WALRUS=true)
  - New /api/bets/build-transaction endpoint returns transaction payload for wallet signing
  - New /api/contract/info endpoint returns package ID, platform ID, network config
  - New /api/bets/:id/verify endpoint verifies bet status across database/Walrus/blockchain
  - Bet response includes onChain object with status, txHash, walrusBlobId, packageId
  - Contract uses 1% fee model consistent with platform (100 basis points)
  - To enable: deploy contract, set BETTING_PLATFORM_ID env var to the shared object ID
- December 29, 2025: Fixed critical bet payout routing bug
  - Added walletAddress column to bets table for correct settlement payouts
  - Bets now store the wallet address of the bettor for settlement
  - Settlement worker uses stored walletAddress (not hardcoded fallback)
  - SettlementService.isBetWon now handles both string and object eventResult
- December 29, 2025: Implemented persistent balance tracking in PostgreSQL
  - BalanceService now uses database instead of in-memory Maps
  - All balance operations (deposits, bets, winnings, revenue) persist to database
  - Balances survive server restarts - critical for settlement reliability
  - Settlement worker correctly processes and persists all winnings/revenue
  - All pages (bet-history, activity, wallet-dashboard, audit-log) now include wallet address for proper data fetching
  - Fixed useWurlusProtocol hook to use correct API endpoints
  - Removed all references to non-existent /api/bets/user endpoint
- December 29, 2025: Fixed critical duplicate payment issues
  - Deposit endpoint now requires txHash and blocks duplicate deposits
  - Settlement worker now processes ALL users' bets (not just user1)
  - New users start with 0 balance (no mock balances)
  - txHash deduplication prevents double-crediting deposits
- December 29, 2025: Multi-day fetch for 200+ upcoming matches - fetches 5 days of football fixtures in parallel to get 250+ events
- December 29, 2025: Fixed cache issue - no longer caches empty API results, preventing stale zero-event displays
- December 29, 2025: Fixed tennis API error - tennis API (v1.tennis.api-sports.io) doesn't exist, now returns empty array cleanly
- Fixed routing issues - removed legacy pages that redirected to old promotions page
- Deleted obsolete pages: home.tsx, promotions.tsx, promotions-real.tsx, Live-new.tsx, live-exact.tsx, sports-exact.tsx, connect-wallet.tsx, redirect-to-promotions.tsx, live/index.tsx
- Updated data refresh intervals: 15 seconds for live events, 30 seconds for upcoming events (was 60 seconds)
- Increased event limit from 50 to 100 per sport for better match coverage
- All pages now use consistent Layout component with cyan/turquoise theme
- Unified routing through App.tsx with modern pages only (clean-home, live-events, bet-history, etc.)
- PostgreSQL database for bets with proper wurlusBetId field
- Zero tolerance for mock data - only genuine API responses with verified live status indicators

## Working API-Sports Endpoints
- Football: v3.football.api-sports.io ✅
- Basketball: v1.basketball.api-sports.io ✅ (Free tier)
- MMA/UFC: v1.mma.api-sports.io ✅
- Baseball: v1.baseball.api-sports.io ✅
- Hockey: v1.hockey.api-sports.io ✅
- Rugby: v1.rugby.api-sports.io ✅
- Handball: v1.handball.api-sports.io ✅
- Volleyball: v1.volleyball.api-sports.io ✅
- Formula 1: v1.formula-1.api-sports.io ✅
- American Football: v1.american-football.api-sports.io ✅

## Non-existent APIs (fall back to football or return empty)
- Tennis, Cricket, Golf, Boxing, Cycling, Snooker, Darts, Table Tennis, Badminton, Motorsport, Esports, Netball, Aussie Rules

## User Preferences

Preferred communication style: Simple, everyday language.