# SuiBets Platform - Crypto Sports Betting Platform

## Overview

SuiBets is a comprehensive crypto sports betting platform built on the Sui blockchain. The platform integrates multiple sports APIs to provide real-time betting opportunities across 30+ sports, featuring automated event tracking, live score updates, and blockchain-based transactions using the Walrus protocol for decentralized storage.

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
- **PostgreSQL** database with Drizzle ORM (optional, with blockchain fallback)
- **Blockchain storage** using Walrus protocol on Sui network
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
- **Walrus protocol** for decentralized data storage
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
- June 24, 2025: Implemented FlashScore live sports data integration
- Created LiveSportsAPI service to fetch current live and upcoming events
- Fixed odds formatting to display proper decimal odds (2.50, 3.25) instead of American format
- Added authentic team names and current match statuses from FlashScore
- Integrated API-Football, SofaScore API, and FlashScore API endpoints
- Real-time live events with proper match progression (1st Half 23', Set 2 6-4, etc.)

## User Preferences

Preferred communication style: Simple, everyday language.