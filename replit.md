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
- **Hybrid Custodial Model**: Users deposit SUI to a platform treasury wallet. Bets are tracked in PostgreSQL, and winnings are settled off-chain. Withdrawals can be automated or manual.
  - **Treasury Wallet**: `0x20850db591c4d575b5238baf975e54580d800e69b8b5b421de796a311d3bea50`
  - **Admin Wallet**: `0x747c44940ec9f0136e3accdd81f37d5b3cc1d62d7747968d633cabb6aa5aa45f`
- **Gas Payment**: Users pay gas for deposits and on-chain bet placement. The platform (admin wallet) pays gas for automated withdrawals and revenue transfers. Betting operations themselves (settlements, crediting winnings) are off-chain and incur no gas fees.

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
- **Deployed Contract (Mainnet)**:
    - Package ID: `0xf8209567df9e80789ec7036f747d6386a8935b50f065e955a715e364f4f893aa`
    - Platform Object ID: `0x5fe75eab8aef1c209e0d2b8d53cd601d4efaf22511e82d8504b0f7f6c754df89`
    - Admin Wallet: `0x747c44940ec9f0136e3accdd81f37d5b3cc1d62d7747968d633cabb6aa5aa45f`
    - Module: `betting` (functions: `place_bet`, `settle_bet`, `void_bet`)

### Payment Integration
- **Stripe**: Optional fiat payment processing.
- **Native Crypto**: Preferred direct blockchain transactions.

### Infrastructure
- **PostgreSQL**: Primary database.
- **WebSocket**: Real-time communication.
- **Session Store**: User session management.