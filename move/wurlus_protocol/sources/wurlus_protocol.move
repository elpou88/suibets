module wurlus_protocol::wurlus_protocol {
    use std::string::{String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::table::{Self, Table};

    // Error codes
    const EInsufficientBalance: u64 = 1;
    const EInvalidBetAmount: u64 = 2;
    const EEventNotFound: u64 = 3;
    const ENotAdmin: u64 = 4;
    const EInvalidMarket: u64 = 5;
    const EInvalidOdds: u64 = 6;
    const EMarketClosed: u64 = 7;
    const EBetAlreadySettled: u64 = 8;
    const EInvalidEventTime: u64 = 9;

    // Status enums
    const STATUS_PENDING: u8 = 0;
    const STATUS_WON: u8 = 1;
    const STATUS_LOST: u8 = 2;
    const STATUS_REFUNDED: u8 = 3;
    const STATUS_CANCELED: u8 = 4;

    // Market types
    const MARKET_MONEYLINE: u8 = 1;
    const MARKET_SPREAD: u8 = 2;
    const MARKET_TOTAL: u8 = 3;
    const MARKET_PROP: u8 = 4;

    // Admin capability for managing the protocol
    struct AdminCap has key {
        id: UID,
    }

    // Protocol settings and state
    struct WurlusProtocol has key {
        id: UID,
        admin: address,
        fee_percentage: u64,
        total_volume: u64,
        total_bets: u64,
        treasury: u64,
        events: Table<ID, SportEvent>,
        bets: Table<ID, Bet>,
        markets: Table<ID, Market>,
    }

    // User wallet data
    struct UserWallet has key {
        id: UID,
        owner: address,
        bets: vector<ID>,
        total_wagered: u64,
        total_won: u64,
        total_lost: u64,
    }

    // Sport event data structure
    struct SportEvent has store {
        id: UID,
        sport_id: u64,
        name: String,
        description: String,
        start_time: u64,
        end_time: u64,
        status: u8,
        home_team: String,
        away_team: String,
        result: Option<String>,
        is_live: bool,
        markets: vector<ID>,
        created_at: u64,
    }

    // Market data structure
    struct Market has store {
        id: UID,
        event_id: ID,
        market_type: u8,
        name: String,
        description: String,
        outcomes: vector<Outcome>,
        status: u8,
        volume: u64,
        created_at: u64,
    }

    // Outcome within a market
    struct Outcome has store, drop {
        name: String,
        odds: u64, // Stored as odds * 100 to handle decimals
        result: Option<bool>,
    }

    // Bet placed by a user
    struct Bet has store {
        id: UID,
        user: address,
        event_id: ID,
        market_id: ID,
        outcome: String,
        amount: u64,
        odds: u64,
        potential_win: u64,
        status: u8,
        created_at: u64,
        settled_at: Option<u64>,
    }

    // Events emitted by the protocol
    struct BetPlaced has copy, drop {
        bet_id: ID,
        user: address,
        event_id: ID,
        market_id: ID,
        outcome: String,
        amount: u64,
        odds: u64,
        potential_win: u64,
        timestamp: u64,
    }

    struct BetSettled has copy, drop {
        bet_id: ID,
        user: address,
        amount: u64,
        won_amount: u64,
        status: u8,
        timestamp: u64,
    }

    struct WalletConnected has copy, drop {
        user: address,
        timestamp: u64,
    }

    struct EventCreated has copy, drop {
        event_id: ID,
        name: String,
        sport_id: u64,
        start_time: u64,
        timestamp: u64,
    }

    struct MarketCreated has copy, drop {
        market_id: ID,
        event_id: ID,
        market_type: u8,
        name: String,
        timestamp: u64,
    }

    // Initialize the protocol - called when publishing the module
    fun init(ctx: &mut TxContext) {
        // Create and transfer admin capability to the deployer
        transfer::transfer(
            AdminCap { id: object::new(ctx) },
            tx_context::sender(ctx)
        );

        // Create the main protocol object
        let protocol = WurlusProtocol {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            fee_percentage: 300, // 3% fee
            total_volume: 0,
            total_bets: 0,
            treasury: 0,
            events: table::new(ctx),
            bets: table::new(ctx),
            markets: table::new(ctx),
        };

        // Share the protocol object so it can be accessed by anyone
        transfer::share_object(protocol);
    }

    // Connect a wallet to the protocol
    public entry fun connect_wallet(ctx: &mut TxContext) {
        // Create a user wallet object
        let wallet = UserWallet {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            bets: vector::empty(),
            total_wagered: 0,
            total_won: 0,
            total_lost: 0,
        };

        // Transfer the wallet object to the user
        transfer::transfer(wallet, tx_context::sender(ctx));

        // Emit event for wallet connection
        event::emit(WalletConnected {
            user: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Create a sports event (admin only)
    public entry fun create_event(
        _: &AdminCap,
        protocol: &mut WurlusProtocol,
        sport_id: u64,
        name: String,
        description: String,
        start_time: u64,
        home_team: String,
        away_team: String,
        ctx: &mut TxContext
    ) {
        // Ensure the caller is the admin
        assert!(tx_context::sender(ctx) == protocol.admin, ENotAdmin);

        // Ensure start time is in the future
        assert!(start_time > tx_context::epoch(ctx), EInvalidEventTime);

        // Create the event object
        let event_id = object::new(ctx);
        let event = SportEvent {
            id: event_id,
            sport_id,
            name,
            description,
            start_time,
            end_time: 0, // Will be set when the event is settled
            status: STATUS_PENDING,
            home_team,
            away_team,
            result: option::none(),
            is_live: false,
            markets: vector::empty(),
            created_at: tx_context::epoch(ctx),
        };

        // Add the event to the protocol
        let event_id = object::uid_to_inner(&event.id);
        table::add(&mut protocol.events, event_id, event);

        // Emit event created event
        event::emit(EventCreated {
            event_id,
            name,
            sport_id,
            start_time,
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Create a market for an event (admin only)
    public entry fun create_market(
        _: &AdminCap,
        protocol: &mut WurlusProtocol,
        event_id: ID,
        market_type: u8,
        name: String,
        description: String,
        outcome_names: vector<String>,
        outcome_odds: vector<u64>,
        ctx: &mut TxContext
    ) {
        // Ensure the caller is the admin
        assert!(tx_context::sender(ctx) == protocol.admin, ENotAdmin);

        // Ensure the event exists
        assert!(table::contains(&protocol.events, event_id), EEventNotFound);

        // Ensure market type is valid
        assert!(
            market_type == MARKET_MONEYLINE || 
            market_type == MARKET_SPREAD || 
            market_type == MARKET_TOTAL || 
            market_type == MARKET_PROP, 
            EInvalidMarket
        );

        // Create outcomes
        let outcomes = vector::empty<Outcome>();
        let i = 0;
        let len = vector::length(&outcome_names);
        
        while (i < len) {
            vector::push_back(&mut outcomes, Outcome {
                name: *vector::borrow(&outcome_names, i),
                odds: *vector::borrow(&outcome_odds, i),
                result: option::none(),
            });
            i = i + 1;
        };

        // Create the market object
        let market_id = object::new(ctx);
        let market = Market {
            id: market_id,
            event_id,
            market_type,
            name,
            description,
            outcomes,
            status: STATUS_PENDING,
            volume: 0,
            created_at: tx_context::epoch(ctx),
        };

        // Add the market to the protocol
        let market_id = object::uid_to_inner(&market.id);
        table::add(&mut protocol.markets, market_id, market);

        // Add market ID to the event's markets vector
        let event = table::borrow_mut(&mut protocol.events, event_id);
        vector::push_back(&mut event.markets, market_id);

        // Emit market created event
        event::emit(MarketCreated {
            market_id,
            event_id,
            market_type,
            name,
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Place a bet on a market outcome
    public entry fun place_bet(
        protocol: &mut WurlusProtocol,
        event_id: ID,
        market_id: ID,
        outcome: String,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Ensure the event exists and is still open
        assert!(table::contains(&protocol.events, event_id), EEventNotFound);
        let event = table::borrow(&protocol.events, event_id);
        assert!(event.status == STATUS_PENDING, EMarketClosed);
        
        // Ensure the market exists and is still open
        assert!(table::contains(&protocol.markets, market_id), EInvalidMarket);
        let market = table::borrow_mut(&mut protocol.markets, market_id);
        assert!(market.status == STATUS_PENDING, EMarketClosed);
        
        // Get the coin value
        let amount = coin::value(&payment);
        assert!(amount > 0, EInvalidBetAmount);
        
        // Find the outcome and get the odds
        let odds = 0;
        let i = 0;
        let len = vector::length(&market.outcomes);
        
        while (i < len) {
            let outcome_obj = vector::borrow(&market.outcomes, i);
            if (outcome_obj.name == outcome) {
                odds = outcome_obj.odds;
                break
            };
            i = i + 1;
        };
        
        assert!(odds > 0, EInvalidOdds);
        
        // Calculate potential winnings
        let potential_win = amount * odds / 100;
        
        // Create the bet
        let bet_id = object::new(ctx);
        let bet = Bet {
            id: bet_id,
            user: tx_context::sender(ctx),
            event_id,
            market_id,
            outcome,
            amount,
            odds,
            potential_win,
            status: STATUS_PENDING,
            created_at: tx_context::epoch(ctx),
            settled_at: option::none(),
        };
        
        // Add the bet to the protocol
        let bet_id = object::uid_to_inner(&bet.id);
        table::add(&mut protocol.bets, bet_id, bet);
        
        // Update market volume
        market.volume = market.volume + amount;
        
        // Update protocol stats
        protocol.total_volume = protocol.total_volume + amount;
        protocol.total_bets = protocol.total_bets + 1;
        
        // Calculate fee
        let fee = amount * protocol.fee_percentage / 10000;
        protocol.treasury = protocol.treasury + fee;
        
        // Deposit the payment to the protocol treasury
        // In a real implementation, would use escrow or similar mechanism
        transfer::public_transfer(payment, protocol.admin);
        
        // Emit bet placed event
        event::emit(BetPlaced {
            bet_id,
            user: tx_context::sender(ctx),
            event_id,
            market_id,
            outcome,
            amount,
            odds,
            potential_win,
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Settle a bet (admin only)
    public entry fun settle_bet(
        _: &AdminCap,
        protocol: &mut WurlusProtocol,
        bet_id: ID,
        is_won: bool,
        ctx: &mut TxContext
    ) {
        // Ensure the caller is the admin
        assert!(tx_context::sender(ctx) == protocol.admin, ENotAdmin);
        
        // Ensure the bet exists
        assert!(table::contains(&protocol.bets, bet_id), EInvalidBetAmount);
        let bet = table::borrow_mut(&mut protocol.bets, bet_id);
        
        // Ensure the bet is not already settled
        assert!(bet.status == STATUS_PENDING, EBetAlreadySettled);
        
        // Update bet status
        if (is_won) {
            bet.status = STATUS_WON;
        } else {
            bet.status = STATUS_LOST;
        };
        
        bet.settled_at = option::some(tx_context::epoch(ctx));
        
        // Calculate payout amount (in a real implementation, would transfer tokens)
        let payout_amount = if (is_won) { bet.potential_win } else { 0 };
        
        // Emit bet settled event
        event::emit(BetSettled {
            bet_id,
            user: bet.user,
            amount: bet.amount,
            won_amount: payout_amount,
            status: bet.status,
            timestamp: tx_context::epoch(ctx),
        });
    }
}
