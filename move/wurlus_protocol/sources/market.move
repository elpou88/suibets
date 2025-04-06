module wurlus_protocol::market {
    use std::string::{String};
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use wurlus_protocol::wurlus_protocol::{Self, WurlusProtocol, AdminCap};

    // Error codes
    const EEventNotFound: u64 = 1;
    const ENotAdmin: u64 = 2;
    const EInvalidMarket: u64 = 3;
    const EInvalidOdds: u64 = 4;
    const EMarketClosed: u64 = 5;
    const EMarketAlreadySettled: u64 = 6;
    const EInvalidOutcome: u64 = 7;

    // Status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_SETTLED: u8 = 1;
    const STATUS_CANCELED: u8 = 2;

    // Market types
    const MARKET_MONEYLINE: u8 = 1;
    const MARKET_SPREAD: u8 = 2;
    const MARKET_TOTAL: u8 = 3;
    const MARKET_PROP: u8 = 4;

    // Market data structure
    struct MarketRegistry has key {
        id: UID,
        markets: Table<ID, MarketDetails>,
        total_markets: u64,
        total_settled_markets: u64,
    }

    // Individual market details
    struct MarketDetails has store {
        market_id: ID,
        event_id: ID,
        market_type: u8,
        name: String,
        description: String,
        outcomes: vector<OutcomeDetails>,
        status: u8,
        volume: u64,
        created_at: u64,
        settled_at: Option<u64>,
    }

    // Outcome details
    struct OutcomeDetails has store, drop {
        name: String,
        odds: u64,
        result: Option<bool>,
    }

    // Events emitted by the market module
    struct MarketCreated has copy, drop {
        market_id: ID,
        event_id: ID,
        market_type: u8,
        name: String,
        timestamp: u64,
    }

    struct MarketUpdated has copy, drop {
        market_id: ID,
        timestamp: u64,
    }

    struct MarketSettled has copy, drop {
        market_id: ID,
        winning_outcome: Option<String>,
        timestamp: u64,
    }

    // Initialize the market registry
    public entry fun initialize_market_registry(ctx: &mut TxContext) {
        let registry = MarketRegistry {
            id: object::new(ctx),
            markets: table::new(ctx),
            total_markets: 0,
            total_settled_markets: 0,
        };

        // Share the market registry so it can be accessed by anyone with the right permissions
        sui::transfer::share_object(registry);
    }

    // Create a new market (admin only)
    public entry fun create_market(
        _: &AdminCap,
        protocol: &mut WurlusProtocol,
        registry: &mut MarketRegistry,
        event_id: ID,
        market_type: u8,
        name: String,
        description: String,
        outcome_names: vector<String>,
        outcome_odds: vector<u64>,
        ctx: &mut TxContext
    ) {
        // Ensure market type is valid
        assert!(
            market_type == MARKET_MONEYLINE || 
            market_type == MARKET_SPREAD || 
            market_type == MARKET_TOTAL || 
            market_type == MARKET_PROP, 
            EInvalidMarket
        );

        // Call the wurlus protocol to create the market
        let market_id = wurlus_protocol::create_market_internal(
            protocol,
            event_id,
            market_type,
            name,
            description,
            outcome_names,
            outcome_odds,
            ctx
        );

        // Create outcomes vector for the registry
        let outcomes = vector::empty<OutcomeDetails>();
        let i = 0;
        let len = vector::length(&outcome_names);
        
        while (i < len) {
            vector::push_back(&mut outcomes, OutcomeDetails {
                name: *vector::borrow(&outcome_names, i),
                odds: *vector::borrow(&outcome_odds, i),
                result: option::none(),
            });
            i = i + 1;
        };

        // Add market to the registry
        let market_details = MarketDetails {
            market_id,
            event_id,
            market_type,
            name,
            description,
            outcomes,
            status: STATUS_PENDING,
            volume: 0,
            created_at: tx_context::epoch(ctx),
            settled_at: option::none(),
        };
        
        table::add(&mut registry.markets, market_id, market_details);
        registry.total_markets = registry.total_markets + 1;

        // Emit market created event
        event::emit(MarketCreated {
            market_id,
            event_id,
            market_type,
            name,
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Update market odds (admin only)
    public entry fun update_market_odds(
        _: &AdminCap,
        protocol: &mut WurlusProtocol,
        registry: &mut MarketRegistry,
        market_id: ID,
        outcome_names: vector<String>,
        outcome_odds: vector<u64>,
        ctx: &mut TxContext
    ) {
        // Ensure the market exists and is still open
        assert!(table::contains(&registry.markets, market_id), EInvalidMarket);
        let market = table::borrow_mut(&mut registry.markets, market_id);
        assert!(market.status == STATUS_PENDING, EMarketClosed);

        // Call wurlus protocol to update the odds
        wurlus_protocol::update_market_odds_internal(
            protocol,
            market_id,
            outcome_names,
            outcome_odds,
            ctx
        );

        // Update the odds in the registry
        let i = 0;
        let len = vector::length(&outcome_names);
        
        while (i < len) {
            let outcome_name = vector::borrow(&outcome_names, i);
            let new_odds = *vector::borrow(&outcome_odds, i);
            
            // Find and update the corresponding outcome
            let j = 0;
            let outcomes_len = vector::length(&market.outcomes);
            
            while (j < outcomes_len) {
                let outcome = vector::borrow_mut(&mut market.outcomes, j);
                if (outcome.name == *outcome_name) {
                    outcome.odds = new_odds;
                    break
                };
                j = j + 1;
            };
            
            i = i + 1;
        };

        // Emit market updated event
        event::emit(MarketUpdated {
            market_id,
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Settle a market (admin only)
    public entry fun settle_market(
        _: &AdminCap,
        protocol: &mut WurlusProtocol,
        registry: &mut MarketRegistry,
        market_id: ID,
        winning_outcome: Option<String>,
        ctx: &mut TxContext
    ) {
        // Ensure the market exists and is still open
        assert!(table::contains(&registry.markets, market_id), EInvalidMarket);
        let market = table::borrow_mut(&mut registry.markets, market_id);
        assert!(market.status == STATUS_PENDING, EMarketAlreadySettled);

        // Call wurlus protocol to settle the market
        wurlus_protocol::settle_market_internal(
            protocol,
            market_id,
            winning_outcome,
            ctx
        );

        // Update market in registry
        market.status = STATUS_SETTLED;
        market.settled_at = option::some(tx_context::epoch(ctx));
        
        // If there's a winning outcome, mark it as the winner
        if (option::is_some(&winning_outcome)) {
            let winner = option::borrow(&winning_outcome);
            
            let i = 0;
            let len = vector::length(&market.outcomes);
            
            while (i < len) {
                let outcome = vector::borrow_mut(&mut market.outcomes, i);
                if (outcome.name == *winner) {
                    outcome.result = option::some(true);
                } else {
                    outcome.result = option::some(false);
                };
                i = i + 1;
            };
        };
        
        // Update registry stats
        registry.total_settled_markets = registry.total_settled_markets + 1;

        // Emit market settled event
        event::emit(MarketSettled {
            market_id,
            winning_outcome,
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Get market details
    public fun get_market_details(registry: &MarketRegistry, market_id: ID): (
        ID, // event_id
        u8, // market_type
        String, // name
        String, // description
        u8, // status
        u64, // volume
        u64, // created_at
        Option<u64> // settled_at
    ) {
        let market = table::borrow(&registry.markets, market_id);
        (
            market.event_id,
            market.market_type,
            market.name,
            market.description,
            market.status,
            market.volume,
            market.created_at,
            market.settled_at
        )
    }

    // Get market outcomes
    public fun get_market_outcomes(registry: &MarketRegistry, market_id: ID): (
        vector<String>, // outcome names
        vector<u64>, // odds
        vector<Option<bool>> // results (if settled)
    ) {
        let market = table::borrow(&registry.markets, market_id);
        let names = vector::empty<String>();
        let odds = vector::empty<u64>();
        let results = vector::empty<Option<bool>>();
        
        let i = 0;
        let len = vector::length(&market.outcomes);
        
        while (i < len) {
            let outcome = vector::borrow(&market.outcomes, i);
            vector::push_back(&mut names, outcome.name);
            vector::push_back(&mut odds, outcome.odds);
            vector::push_back(&mut results, outcome.result);
            i = i + 1;
        };
        
        (names, odds, results)
    }
}
