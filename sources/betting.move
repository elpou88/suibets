module suibets::betting {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    
    use sbets_token::sbets::SBETS;

    // Error codes
    const EInsufficientBalance: u64 = 0;
    const EBetAlreadySettled: u64 = 1;
    const EUnauthorized: u64 = 2;
    const EInvalidOdds: u64 = 3;
    const EBetNotFound: u64 = 4;
    const EEventNotFinished: u64 = 5;
    const EInvalidAmount: u64 = 6;
    const EPlatformPaused: u64 = 7;
    const EExceedsMaxBet: u64 = 8;
    const EExceedsMinBet: u64 = 9;

    // Bet status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_WON: u8 = 1;
    const STATUS_LOST: u8 = 2;
    const STATUS_VOID: u8 = 3;

    // Coin type constants for bet tracking
    const COIN_TYPE_SUI: u8 = 0;
    const COIN_TYPE_SBETS: u8 = 1;

    // Platform configuration (1% fee = 100 basis points)
    const PLATFORM_FEE_BPS: u64 = 100;
    const BPS_DENOMINATOR: u64 = 10000;

    // Default bet limits (in smallest units: 1 SUI/SBETS = 1_000_000_000)
    const DEFAULT_MIN_BET: u64 = 100_000_000; // 0.1 SUI/SBETS
    const DEFAULT_MAX_BET: u64 = 100_000_000_000; // 100 SUI/SBETS
    const MAX_FEE_BPS: u64 = 1000; // 10% max fee

    // Betting platform shared object with dual treasury (SUI + SBETS)
    public struct BettingPlatform has key {
        id: UID,
        // SUI treasury
        treasury_sui: Balance<SUI>,
        total_volume_sui: u64,
        total_potential_liability_sui: u64,
        accrued_fees_sui: u64,
        // SBETS treasury
        treasury_sbets: Balance<SBETS>,
        total_volume_sbets: u64,
        total_potential_liability_sbets: u64,
        accrued_fees_sbets: u64,
        // Shared settings
        platform_fee_bps: u64,
        total_bets: u64,
        admin: address,
        pending_admin: address,
        oracles: Table<address, bool>,
        paused: bool,
        min_bet: u64,
        max_bet: u64,
    }

    // Individual bet object owned by bettor
    public struct Bet has key, store {
        id: UID,
        bettor: address,
        event_id: vector<u8>,
        market_id: vector<u8>,
        prediction: vector<u8>,
        odds: u64,
        stake: u64,
        potential_payout: u64,
        platform_fee: u64,
        status: u8,
        placed_at: u64,
        settled_at: u64,
        walrus_blob_id: vector<u8>,
        coin_type: u8, // 0 = SUI, 1 = SBETS
    }

    // Events
    public struct BetPlaced has copy, drop {
        bet_id: ID,
        bettor: address,
        event_id: vector<u8>,
        prediction: vector<u8>,
        odds: u64,
        stake: u64,
        potential_payout: u64,
        coin_type: u8,
        timestamp: u64,
    }

    public struct BetSettled has copy, drop {
        bet_id: ID,
        bettor: address,
        status: u8,
        payout: u64,
        coin_type: u8,
        timestamp: u64,
    }

    public struct PlatformCreated has copy, drop {
        platform_id: ID,
        admin: address,
        fee_bps: u64,
    }

    public struct PlatformPaused has copy, drop {
        platform_id: ID,
        paused: bool,
        timestamp: u64,
    }

    public struct AdminTransferred has copy, drop {
        platform_id: ID,
        old_admin: address,
        new_admin: address,
        timestamp: u64,
    }

    public struct LiquidityDeposited has copy, drop {
        platform_id: ID,
        depositor: address,
        amount: u64,
        coin_type: u8,
        timestamp: u64,
    }

    public struct EmergencyWithdrawal has copy, drop {
        platform_id: ID,
        admin: address,
        amount: u64,
        coin_type: u8,
        timestamp: u64,
    }

    public struct FeesWithdrawn has copy, drop {
        platform_id: ID,
        admin: address,
        amount: u64,
        coin_type: u8,
        timestamp: u64,
    }

    // Initialize the betting platform
    fun init(ctx: &mut TxContext) {
        let admin_addr = tx_context::sender(ctx);
        let platform = BettingPlatform {
            id: object::new(ctx),
            // SUI treasury
            treasury_sui: balance::zero(),
            total_volume_sui: 0,
            total_potential_liability_sui: 0,
            accrued_fees_sui: 0,
            // SBETS treasury
            treasury_sbets: balance::zero(),
            total_volume_sbets: 0,
            total_potential_liability_sbets: 0,
            accrued_fees_sbets: 0,
            // Shared settings
            platform_fee_bps: PLATFORM_FEE_BPS,
            total_bets: 0,
            admin: admin_addr,
            pending_admin: admin_addr,
            oracles: table::new(ctx),
            paused: false,
            min_bet: DEFAULT_MIN_BET,
            max_bet: DEFAULT_MAX_BET,
        };

        event::emit(PlatformCreated {
            platform_id: object::id(&platform),
            admin: admin_addr,
            fee_bps: PLATFORM_FEE_BPS,
        });

        transfer::share_object(platform);
    }

    // ============ SUI BETTING ============

    // Place a bet with SUI
    public entry fun place_bet(
        platform: &mut BettingPlatform,
        payment: Coin<SUI>,
        event_id: vector<u8>,
        market_id: vector<u8>,
        prediction: vector<u8>,
        odds: u64,
        walrus_blob_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!platform.paused, EPlatformPaused);
        
        let stake = coin::value(&payment);
        assert!(stake > 0, EInvalidAmount);
        assert!(stake >= platform.min_bet, EExceedsMinBet);
        assert!(stake <= platform.max_bet, EExceedsMaxBet);
        assert!(odds >= 100, EInvalidOdds);

        let potential_payout = (stake * odds) / 100;
        
        // Check solvency for SUI treasury
        let current_treasury = balance::value(&platform.treasury_sui);
        assert!(
            current_treasury + stake >= platform.total_potential_liability_sui + potential_payout,
            EInsufficientBalance
        );

        let payment_balance = coin::into_balance(payment);
        balance::join(&mut platform.treasury_sui, payment_balance);

        platform.total_bets = platform.total_bets + 1;
        platform.total_volume_sui = platform.total_volume_sui + stake;
        platform.total_potential_liability_sui = platform.total_potential_liability_sui + potential_payout;

        let bettor = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        let bet = Bet {
            id: object::new(ctx),
            bettor,
            event_id,
            market_id,
            prediction,
            odds,
            stake,
            potential_payout,
            platform_fee: 0,
            status: STATUS_PENDING,
            placed_at: timestamp,
            settled_at: 0,
            walrus_blob_id,
            coin_type: COIN_TYPE_SUI,
        };

        let bet_id = object::id(&bet);

        event::emit(BetPlaced {
            bet_id,
            bettor,
            event_id: bet.event_id,
            prediction: bet.prediction,
            odds,
            stake,
            potential_payout,
            coin_type: COIN_TYPE_SUI,
            timestamp,
        });

        transfer::transfer(bet, bettor);
    }

    // Settle a SUI bet
    public entry fun settle_bet(
        platform: &mut BettingPlatform,
        bet: &mut Bet,
        won: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(
            caller == platform.admin || table::contains(&platform.oracles, caller),
            EUnauthorized
        );
        assert!(bet.status == STATUS_PENDING, EBetAlreadySettled);
        assert!(bet.coin_type == COIN_TYPE_SUI, EInvalidAmount);

        let timestamp = clock::timestamp_ms(clock);
        bet.settled_at = timestamp;
        
        platform.total_potential_liability_sui = platform.total_potential_liability_sui - bet.potential_payout;

        if (won) {
            bet.status = STATUS_WON;
            
            let profit = bet.potential_payout - bet.stake;
            let win_fee = (profit * platform.platform_fee_bps) / BPS_DENOMINATOR;
            let net_payout = bet.potential_payout - win_fee;
            
            platform.accrued_fees_sui = platform.accrued_fees_sui + win_fee;
            bet.platform_fee = win_fee;
            
            assert!(balance::value(&platform.treasury_sui) >= net_payout, EInsufficientBalance);
            
            let payout_balance = balance::split(&mut platform.treasury_sui, net_payout);
            let payout_coin = coin::from_balance(payout_balance, ctx);
            transfer::public_transfer(payout_coin, bet.bettor);

            event::emit(BetSettled {
                bet_id: object::id(bet),
                bettor: bet.bettor,
                status: STATUS_WON,
                payout: net_payout,
                coin_type: COIN_TYPE_SUI,
                timestamp,
            });
        } else {
            bet.status = STATUS_LOST;
            platform.accrued_fees_sui = platform.accrued_fees_sui + bet.stake;

            event::emit(BetSettled {
                bet_id: object::id(bet),
                bettor: bet.bettor,
                status: STATUS_LOST,
                payout: 0,
                coin_type: COIN_TYPE_SUI,
                timestamp,
            });
        }
    }

    // Void a SUI bet
    public entry fun void_bet(
        platform: &mut BettingPlatform,
        bet: &mut Bet,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(
            caller == platform.admin || table::contains(&platform.oracles, caller),
            EUnauthorized
        );
        assert!(bet.status == STATUS_PENDING, EBetAlreadySettled);
        assert!(bet.coin_type == COIN_TYPE_SUI, EInvalidAmount);

        bet.status = STATUS_VOID;
        bet.settled_at = clock::timestamp_ms(clock);
        
        platform.total_potential_liability_sui = platform.total_potential_liability_sui - bet.potential_payout;

        let refund_amount = bet.stake;
        
        if (balance::value(&platform.treasury_sui) >= refund_amount) {
            let refund_balance = balance::split(&mut platform.treasury_sui, refund_amount);
            let refund_coin = coin::from_balance(refund_balance, ctx);
            transfer::public_transfer(refund_coin, bet.bettor);
        };

        event::emit(BetSettled {
            bet_id: object::id(bet),
            bettor: bet.bettor,
            status: STATUS_VOID,
            payout: refund_amount,
            coin_type: COIN_TYPE_SUI,
            timestamp: bet.settled_at,
        });
    }

    // ============ SBETS BETTING ============

    // Place a bet with SBETS
    public entry fun place_bet_sbets(
        platform: &mut BettingPlatform,
        payment: Coin<SBETS>,
        event_id: vector<u8>,
        market_id: vector<u8>,
        prediction: vector<u8>,
        odds: u64,
        walrus_blob_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!platform.paused, EPlatformPaused);
        
        let stake = coin::value(&payment);
        assert!(stake > 0, EInvalidAmount);
        assert!(stake >= platform.min_bet, EExceedsMinBet);
        assert!(stake <= platform.max_bet, EExceedsMaxBet);
        assert!(odds >= 100, EInvalidOdds);

        let potential_payout = (stake * odds) / 100;
        
        // Check solvency for SBETS treasury
        let current_treasury = balance::value(&platform.treasury_sbets);
        assert!(
            current_treasury + stake >= platform.total_potential_liability_sbets + potential_payout,
            EInsufficientBalance
        );

        let payment_balance = coin::into_balance(payment);
        balance::join(&mut platform.treasury_sbets, payment_balance);

        platform.total_bets = platform.total_bets + 1;
        platform.total_volume_sbets = platform.total_volume_sbets + stake;
        platform.total_potential_liability_sbets = platform.total_potential_liability_sbets + potential_payout;

        let bettor = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        let bet = Bet {
            id: object::new(ctx),
            bettor,
            event_id,
            market_id,
            prediction,
            odds,
            stake,
            potential_payout,
            platform_fee: 0,
            status: STATUS_PENDING,
            placed_at: timestamp,
            settled_at: 0,
            walrus_blob_id,
            coin_type: COIN_TYPE_SBETS,
        };

        let bet_id = object::id(&bet);

        event::emit(BetPlaced {
            bet_id,
            bettor,
            event_id: bet.event_id,
            prediction: bet.prediction,
            odds,
            stake,
            potential_payout,
            coin_type: COIN_TYPE_SBETS,
            timestamp,
        });

        transfer::transfer(bet, bettor);
    }

    // Settle a SBETS bet
    public entry fun settle_bet_sbets(
        platform: &mut BettingPlatform,
        bet: &mut Bet,
        won: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(
            caller == platform.admin || table::contains(&platform.oracles, caller),
            EUnauthorized
        );
        assert!(bet.status == STATUS_PENDING, EBetAlreadySettled);
        assert!(bet.coin_type == COIN_TYPE_SBETS, EInvalidAmount);

        let timestamp = clock::timestamp_ms(clock);
        bet.settled_at = timestamp;
        
        platform.total_potential_liability_sbets = platform.total_potential_liability_sbets - bet.potential_payout;

        if (won) {
            bet.status = STATUS_WON;
            
            let profit = bet.potential_payout - bet.stake;
            let win_fee = (profit * platform.platform_fee_bps) / BPS_DENOMINATOR;
            let net_payout = bet.potential_payout - win_fee;
            
            platform.accrued_fees_sbets = platform.accrued_fees_sbets + win_fee;
            bet.platform_fee = win_fee;
            
            assert!(balance::value(&platform.treasury_sbets) >= net_payout, EInsufficientBalance);
            
            let payout_balance = balance::split(&mut platform.treasury_sbets, net_payout);
            let payout_coin = coin::from_balance(payout_balance, ctx);
            transfer::public_transfer(payout_coin, bet.bettor);

            event::emit(BetSettled {
                bet_id: object::id(bet),
                bettor: bet.bettor,
                status: STATUS_WON,
                payout: net_payout,
                coin_type: COIN_TYPE_SBETS,
                timestamp,
            });
        } else {
            bet.status = STATUS_LOST;
            platform.accrued_fees_sbets = platform.accrued_fees_sbets + bet.stake;

            event::emit(BetSettled {
                bet_id: object::id(bet),
                bettor: bet.bettor,
                status: STATUS_LOST,
                payout: 0,
                coin_type: COIN_TYPE_SBETS,
                timestamp,
            });
        }
    }

    // Void a SBETS bet
    public entry fun void_bet_sbets(
        platform: &mut BettingPlatform,
        bet: &mut Bet,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(
            caller == platform.admin || table::contains(&platform.oracles, caller),
            EUnauthorized
        );
        assert!(bet.status == STATUS_PENDING, EBetAlreadySettled);
        assert!(bet.coin_type == COIN_TYPE_SBETS, EInvalidAmount);

        bet.status = STATUS_VOID;
        bet.settled_at = clock::timestamp_ms(clock);
        
        platform.total_potential_liability_sbets = platform.total_potential_liability_sbets - bet.potential_payout;

        let refund_amount = bet.stake;
        
        if (balance::value(&platform.treasury_sbets) >= refund_amount) {
            let refund_balance = balance::split(&mut platform.treasury_sbets, refund_amount);
            let refund_coin = coin::from_balance(refund_balance, ctx);
            transfer::public_transfer(refund_coin, bet.bettor);
        };

        event::emit(BetSettled {
            bet_id: object::id(bet),
            bettor: bet.bettor,
            status: STATUS_VOID,
            payout: refund_amount,
            coin_type: COIN_TYPE_SBETS,
            timestamp: bet.settled_at,
        });
    }

    // ============ ADMIN FUNCTIONS ============

    // Add an oracle
    public entry fun add_oracle(
        platform: &mut BettingPlatform,
        oracle_address: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        table::add(&mut platform.oracles, oracle_address, true);
    }

    // Remove an oracle
    public entry fun remove_oracle(
        platform: &mut BettingPlatform,
        oracle_address: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        table::remove(&mut platform.oracles, oracle_address);
    }

    // Withdraw SUI platform fees
    public entry fun withdraw_fees(
        platform: &mut BettingPlatform,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == platform.admin, EUnauthorized);
        
        let treasury_value = balance::value(&platform.treasury_sui);
        let reserved = platform.total_potential_liability_sui;
        
        let surplus = if (treasury_value > reserved) { treasury_value - reserved } else { 0 };
        let max_withdraw = if (surplus < platform.accrued_fees_sui) { surplus } else { platform.accrued_fees_sui };
        
        assert!(amount <= max_withdraw, EInsufficientBalance);
        
        platform.accrued_fees_sui = platform.accrued_fees_sui - amount;
        
        let withdraw_balance = balance::split(&mut platform.treasury_sui, amount);
        let withdraw_coin = coin::from_balance(withdraw_balance, ctx);
        transfer::public_transfer(withdraw_coin, platform.admin);
        
        event::emit(FeesWithdrawn {
            platform_id: object::id(platform),
            admin: caller,
            amount,
            coin_type: COIN_TYPE_SUI,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Withdraw SBETS platform fees
    public entry fun withdraw_fees_sbets(
        platform: &mut BettingPlatform,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == platform.admin, EUnauthorized);
        
        let treasury_value = balance::value(&platform.treasury_sbets);
        let reserved = platform.total_potential_liability_sbets;
        
        let surplus = if (treasury_value > reserved) { treasury_value - reserved } else { 0 };
        let max_withdraw = if (surplus < platform.accrued_fees_sbets) { surplus } else { platform.accrued_fees_sbets };
        
        assert!(amount <= max_withdraw, EInsufficientBalance);
        
        platform.accrued_fees_sbets = platform.accrued_fees_sbets - amount;
        
        let withdraw_balance = balance::split(&mut platform.treasury_sbets, amount);
        let withdraw_coin = coin::from_balance(withdraw_balance, ctx);
        transfer::public_transfer(withdraw_coin, platform.admin);
        
        event::emit(FeesWithdrawn {
            platform_id: object::id(platform),
            admin: caller,
            amount,
            coin_type: COIN_TYPE_SBETS,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Update platform fee
    public entry fun update_fee(
        platform: &mut BettingPlatform,
        new_fee_bps: u64,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        assert!(new_fee_bps <= MAX_FEE_BPS, EInvalidAmount);
        platform.platform_fee_bps = new_fee_bps;
    }

    // Pause/unpause platform
    public entry fun set_pause(
        platform: &mut BettingPlatform,
        paused: bool,
        clock: &Clock,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        platform.paused = paused;
        
        event::emit(PlatformPaused {
            platform_id: object::id(platform),
            paused,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Propose new admin
    public entry fun propose_admin(
        platform: &mut BettingPlatform,
        new_admin: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        platform.pending_admin = new_admin;
    }

    // Accept admin role
    public entry fun accept_admin(
        platform: &mut BettingPlatform,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == platform.pending_admin, EUnauthorized);
        
        let old_admin = platform.admin;
        platform.admin = caller;
        platform.pending_admin = caller;
        
        event::emit(AdminTransferred {
            platform_id: object::id(platform),
            old_admin,
            new_admin: caller,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Deposit SUI liquidity
    public entry fun deposit_liquidity(
        platform: &mut BettingPlatform,
        funds: Coin<SUI>,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == platform.admin, EUnauthorized);
        
        let amount = coin::value(&funds);
        assert!(amount > 0, EInvalidAmount);
        
        let funds_balance = coin::into_balance(funds);
        balance::join(&mut platform.treasury_sui, funds_balance);
        
        event::emit(LiquidityDeposited {
            platform_id: object::id(platform),
            depositor: caller,
            amount,
            coin_type: COIN_TYPE_SUI,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Deposit SBETS liquidity
    public entry fun deposit_liquidity_sbets(
        platform: &mut BettingPlatform,
        funds: Coin<SBETS>,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == platform.admin, EUnauthorized);
        
        let amount = coin::value(&funds);
        assert!(amount > 0, EInvalidAmount);
        
        let funds_balance = coin::into_balance(funds);
        balance::join(&mut platform.treasury_sbets, funds_balance);
        
        event::emit(LiquidityDeposited {
            platform_id: object::id(platform),
            depositor: caller,
            amount,
            coin_type: COIN_TYPE_SBETS,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Emergency withdrawal SUI (requires paused)
    public entry fun emergency_withdraw(
        platform: &mut BettingPlatform,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == platform.admin, EUnauthorized);
        assert!(platform.paused, EPlatformPaused);
        
        let treasury_value = balance::value(&platform.treasury_sui);
        let reserved = platform.total_potential_liability_sui;
        let withdrawable = if (treasury_value > reserved) { treasury_value - reserved } else { 0 };
        let max_withdraw = if (withdrawable < platform.accrued_fees_sui) { withdrawable } else { platform.accrued_fees_sui };
        
        assert!(amount <= max_withdraw, EInsufficientBalance);
        assert!(treasury_value >= amount, EInsufficientBalance);
        
        platform.accrued_fees_sui = platform.accrued_fees_sui - amount;
        
        let withdraw_balance = balance::split(&mut platform.treasury_sui, amount);
        let withdraw_coin = coin::from_balance(withdraw_balance, ctx);
        transfer::public_transfer(withdraw_coin, platform.admin);
        
        event::emit(EmergencyWithdrawal {
            platform_id: object::id(platform),
            admin: caller,
            amount,
            coin_type: COIN_TYPE_SUI,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Emergency withdrawal SBETS (requires paused)
    public entry fun emergency_withdraw_sbets(
        platform: &mut BettingPlatform,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == platform.admin, EUnauthorized);
        assert!(platform.paused, EPlatformPaused);
        
        let treasury_value = balance::value(&platform.treasury_sbets);
        let reserved = platform.total_potential_liability_sbets;
        let withdrawable = if (treasury_value > reserved) { treasury_value - reserved } else { 0 };
        let max_withdraw = if (withdrawable < platform.accrued_fees_sbets) { withdrawable } else { platform.accrued_fees_sbets };
        
        assert!(amount <= max_withdraw, EInsufficientBalance);
        assert!(treasury_value >= amount, EInsufficientBalance);
        
        platform.accrued_fees_sbets = platform.accrued_fees_sbets - amount;
        
        let withdraw_balance = balance::split(&mut platform.treasury_sbets, amount);
        let withdraw_coin = coin::from_balance(withdraw_balance, ctx);
        transfer::public_transfer(withdraw_coin, platform.admin);
        
        event::emit(EmergencyWithdrawal {
            platform_id: object::id(platform),
            admin: caller,
            amount,
            coin_type: COIN_TYPE_SBETS,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // Update bet limits
    public entry fun update_limits(
        platform: &mut BettingPlatform,
        new_min_bet: u64,
        new_max_bet: u64,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        assert!(new_min_bet > 0, EInvalidAmount);
        assert!(new_max_bet > 0, EInvalidAmount);
        assert!(new_min_bet <= new_max_bet, EInvalidAmount);
        
        platform.min_bet = new_min_bet;
        platform.max_bet = new_max_bet;
    }

    // ============ VIEW FUNCTIONS ============

    public fun get_bet_status(bet: &Bet): u8 { bet.status }
    public fun get_bet_stake(bet: &Bet): u64 { bet.stake }
    public fun get_bet_payout(bet: &Bet): u64 { bet.potential_payout }
    public fun get_bet_coin_type(bet: &Bet): u8 { bet.coin_type }

    public fun get_platform_stats_sui(platform: &BettingPlatform): (u64, u64, u64) {
        (platform.total_bets, platform.total_volume_sui, balance::value(&platform.treasury_sui))
    }

    public fun get_platform_stats_sbets(platform: &BettingPlatform): (u64, u64, u64) {
        (platform.total_bets, platform.total_volume_sbets, balance::value(&platform.treasury_sbets))
    }

    public fun is_oracle(platform: &BettingPlatform, addr: address): bool {
        table::contains(&platform.oracles, addr)
    }

    public fun is_paused(platform: &BettingPlatform): bool { platform.paused }
    public fun get_admin(platform: &BettingPlatform): address { platform.admin }
    public fun get_bet_limits(platform: &BettingPlatform): (u64, u64) { (platform.min_bet, platform.max_bet) }
    public fun get_fee_bps(platform: &BettingPlatform): u64 { platform.platform_fee_bps }

    public fun get_liabilities_sui(platform: &BettingPlatform): (u64, u64) {
        (platform.total_potential_liability_sui, platform.accrued_fees_sui)
    }

    public fun get_liabilities_sbets(platform: &BettingPlatform): (u64, u64) {
        (platform.total_potential_liability_sbets, platform.accrued_fees_sbets)
    }

    public fun get_available_balance_sui(platform: &BettingPlatform): u64 {
        let treasury = balance::value(&platform.treasury_sui);
        let reserved = platform.total_potential_liability_sui;
        if (treasury > reserved) { treasury - reserved } else { 0 }
    }

    public fun get_available_balance_sbets(platform: &BettingPlatform): u64 {
        let treasury = balance::value(&platform.treasury_sbets);
        let reserved = platform.total_potential_liability_sbets;
        if (treasury > reserved) { treasury - reserved } else { 0 }
    }

    #[test_only]
    public fun create_platform_for_testing(ctx: &mut TxContext): BettingPlatform {
        let admin_addr = tx_context::sender(ctx);
        BettingPlatform {
            id: object::new(ctx),
            treasury_sui: balance::zero(),
            total_volume_sui: 0,
            total_potential_liability_sui: 0,
            accrued_fees_sui: 0,
            treasury_sbets: balance::zero(),
            total_volume_sbets: 0,
            total_potential_liability_sbets: 0,
            accrued_fees_sbets: 0,
            platform_fee_bps: PLATFORM_FEE_BPS,
            total_bets: 0,
            admin: admin_addr,
            pending_admin: admin_addr,
            oracles: table::new(ctx),
            paused: false,
            min_bet: DEFAULT_MIN_BET,
            max_bet: DEFAULT_MAX_BET,
        }
    }
}
