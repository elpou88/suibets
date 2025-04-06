module wurlus_protocol::betting {
    use std::string::{String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::table::{Self, Table};
    use wurlus_protocol::wurlus_protocol::{Self, WurlusProtocol, AdminCap};

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

    // Status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_WON: u8 = 1;
    const STATUS_LOST: u8 = 2;
    const STATUS_REFUNDED: u8 = 3;
    const STATUS_CANCELED: u8 = 4;

    // Bet data structure
    struct BettingRecord has key {
        id: UID,
        user: address,
        bets: Table<ID, BetDetails>,
        active_bets: u64,
        settled_bets: u64,
        total_wagered: u64,
        total_won: u64,
        total_fees_paid: u64,
    }

    // Individual bet details
    struct BetDetails has store {
        bet_id: ID,
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

    // Events emitted by the betting module
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

    // Initialize a user's betting record
    public entry fun initialize_betting_record(ctx: &mut TxContext) {
        let record = BettingRecord {
            id: object::new(ctx),
            user: tx_context::sender(ctx),
            bets: table::new(ctx),
            active_bets: 0,
            settled_bets: 0,
            total_wagered: 0,
            total_won: 0,
            total_fees_paid: 0,
        };

        transfer::transfer(record, tx_context::sender(ctx));
    }

    // Place a bet on a market outcome
    public entry fun place_bet(
        protocol: &mut WurlusProtocol,
        record: &mut BettingRecord,
        event_id: ID,
        market_id: ID,
        outcome: String,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Ensure the user owns the betting record
        assert!(record.user == tx_context::sender(ctx), 0);
        
        // Get the coin value
        let amount = coin::value(&payment);
        assert!(amount > 0, EInvalidBetAmount);
        
        // Call the wurlus protocol to place the bet
        let (bet_id, odds, potential_win) = wurlus_protocol::place_bet_internal(
            protocol, 
            event_id, 
            market_id, 
            outcome, 
            payment, 
            ctx
        );
        
        // Add bet to the user's betting record
        let bet_details = BetDetails {
            bet_id,
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
        
        table::add(&mut record.bets, bet_id, bet_details);
        
        // Update betting record stats
        record.active_bets = record.active_bets + 1;
        record.total_wagered = record.total_wagered + amount;
        
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

    // Update a bet's status after settlement (admin only)
    public entry fun update_bet_settlement(
        _: &AdminCap,
        record: &mut BettingRecord,
        bet_id: ID,
        is_won: bool,
        payout_amount: u64,
        ctx: &mut TxContext
    ) {
        // Ensure the bet exists in the record
        assert!(table::contains(&record.bets, bet_id), EInvalidBetAmount);
        let bet = table::borrow_mut(&mut record.bets, bet_id);
        
        // Ensure the bet is not already settled
        assert!(bet.status == STATUS_PENDING, EBetAlreadySettled);
        
        // Update bet status
        if (is_won) {
            bet.status = STATUS_WON;
            record.total_won = record.total_won + payout_amount;
        } else {
            bet.status = STATUS_LOST;
        };
        
        bet.settled_at = option::some(tx_context::epoch(ctx));
        
        // Update record stats
        record.active_bets = record.active_bets - 1;
        record.settled_bets = record.settled_bets + 1;
        
        // Emit bet settled event
        event::emit(BetSettled {
            bet_id,
            user: record.user,
            amount: bet.amount,
            won_amount: if (is_won) { payout_amount } else { 0 },
            status: bet.status,
            timestamp: tx_context::epoch(ctx),
        });
    }

    // Get a user's bet details
    public fun get_bet_details(record: &BettingRecord, bet_id: ID): (
        ID, // event_id
        ID, // market_id
        String, // outcome
        u64, // amount
        u64, // odds
        u64, // potential_win
        u8,  // status
        u64, // created_at
        Option<u64> // settled_at
    ) {
        let bet = table::borrow(&record.bets, bet_id);
        (
            bet.event_id,
            bet.market_id,
            bet.outcome,
            bet.amount,
            bet.odds,
            bet.potential_win,
            bet.status,
            bet.created_at,
            bet.settled_at
        )
    }

    // Get a user's betting stats
    public fun get_betting_stats(record: &BettingRecord): (
        u64, // active_bets
        u64, // settled_bets
        u64, // total_wagered
        u64, // total_won
        u64  // total_fees_paid
    ) {
        (
            record.active_bets,
            record.settled_bets,
            record.total_wagered,
            record.total_won,
            record.total_fees_paid
        )
    }
}
