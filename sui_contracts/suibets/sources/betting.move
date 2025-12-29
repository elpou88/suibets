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

    // Error codes
    const EInsufficientBalance: u64 = 0;
    const EBetAlreadySettled: u64 = 1;
    const EUnauthorized: u64 = 2;
    const EInvalidOdds: u64 = 3;
    const EBetNotFound: u64 = 4;
    const EEventNotFinished: u64 = 5;
    const EInvalidAmount: u64 = 6;

    // Bet status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_WON: u8 = 1;
    const STATUS_LOST: u8 = 2;
    const STATUS_VOID: u8 = 3;

    // Platform configuration (1% fee = 100 basis points)
    const PLATFORM_FEE_BPS: u64 = 100;
    const BPS_DENOMINATOR: u64 = 10000;

    // Betting platform shared object
    public struct BettingPlatform has key {
        id: UID,
        treasury: Balance<SUI>,
        platform_fee_bps: u64,
        total_bets: u64,
        total_volume: u64,
        admin: address,
        oracles: Table<address, bool>,
    }

    // Individual bet object owned by bettor
    public struct Bet has key, store {
        id: UID,
        bettor: address,
        event_id: vector<u8>,
        market_id: vector<u8>,
        prediction: vector<u8>,
        odds: u64, // Odds in basis points (e.g., 250 = 2.50x)
        stake: u64,
        potential_payout: u64,
        platform_fee: u64,
        status: u8,
        placed_at: u64,
        settled_at: u64,
        walrus_blob_id: vector<u8>,
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
        timestamp: u64,
    }

    public struct BetSettled has copy, drop {
        bet_id: ID,
        bettor: address,
        status: u8,
        payout: u64,
        timestamp: u64,
    }

    public struct PlatformCreated has copy, drop {
        platform_id: ID,
        admin: address,
        fee_bps: u64,
    }

    // Initialize the betting platform
    fun init(ctx: &mut TxContext) {
        let platform = BettingPlatform {
            id: object::new(ctx),
            treasury: balance::zero(),
            platform_fee_bps: PLATFORM_FEE_BPS,
            total_bets: 0,
            total_volume: 0,
            admin: tx_context::sender(ctx),
            oracles: table::new(ctx),
        };

        event::emit(PlatformCreated {
            platform_id: object::id(&platform),
            admin: tx_context::sender(ctx),
            fee_bps: PLATFORM_FEE_BPS,
        });

        transfer::share_object(platform);
    }

    // Place a bet - callable by any user with SUI tokens
    public entry fun place_bet(
        platform: &mut BettingPlatform,
        payment: Coin<SUI>,
        event_id: vector<u8>,
        market_id: vector<u8>,
        prediction: vector<u8>,
        odds: u64, // In basis points (250 = 2.50x)
        walrus_blob_id: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let stake = coin::value(&payment);
        assert!(stake > 0, EInvalidAmount);
        assert!(odds >= 100, EInvalidOdds); // Minimum 1.00x odds

        // Calculate platform fee (1%)
        let fee = (stake * platform.platform_fee_bps) / BPS_DENOMINATOR;
        let net_stake = stake - fee;
        
        // Calculate potential payout: stake * (odds / 100)
        let potential_payout = (net_stake * odds) / 100;

        // Take payment into platform treasury
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut platform.treasury, payment_balance);

        // Update platform stats
        platform.total_bets = platform.total_bets + 1;
        platform.total_volume = platform.total_volume + stake;

        let bettor = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Create bet object
        let bet = Bet {
            id: object::new(ctx),
            bettor,
            event_id,
            market_id,
            prediction,
            odds,
            stake: net_stake,
            potential_payout,
            platform_fee: fee,
            status: STATUS_PENDING,
            placed_at: timestamp,
            settled_at: 0,
            walrus_blob_id,
        };

        let bet_id = object::id(&bet);

        event::emit(BetPlaced {
            bet_id,
            bettor,
            event_id: bet.event_id,
            prediction: bet.prediction,
            odds,
            stake: net_stake,
            potential_payout,
            timestamp,
        });

        // Transfer bet to bettor
        transfer::transfer(bet, bettor);
    }

    // Settle a bet - only callable by authorized oracle
    public entry fun settle_bet(
        platform: &mut BettingPlatform,
        bet: &mut Bet,
        won: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        
        // Verify caller is admin or authorized oracle
        assert!(
            caller == platform.admin || table::contains(&platform.oracles, caller),
            EUnauthorized
        );

        // Verify bet hasn't been settled
        assert!(bet.status == STATUS_PENDING, EBetAlreadySettled);

        let timestamp = clock::timestamp_ms(clock);
        bet.settled_at = timestamp;

        if (won) {
            bet.status = STATUS_WON;
            
            // Calculate payout with 1% fee on winnings
            let win_fee = (bet.potential_payout * platform.platform_fee_bps) / BPS_DENOMINATOR;
            let net_payout = bet.potential_payout - win_fee;
            
            // Ensure treasury has enough balance
            assert!(balance::value(&platform.treasury) >= net_payout, EInsufficientBalance);
            
            // Pay winner
            let payout_balance = balance::split(&mut platform.treasury, net_payout);
            let payout_coin = coin::from_balance(payout_balance, ctx);
            transfer::public_transfer(payout_coin, bet.bettor);

            event::emit(BetSettled {
                bet_id: object::id(bet),
                bettor: bet.bettor,
                status: STATUS_WON,
                payout: net_payout,
                timestamp,
            });
        } else {
            bet.status = STATUS_LOST;
            // Lost stake stays in treasury as platform revenue

            event::emit(BetSettled {
                bet_id: object::id(bet),
                bettor: bet.bettor,
                status: STATUS_LOST,
                payout: 0,
                timestamp,
            });
        }
    }

    // Void a bet - refund to bettor
    public entry fun void_bet(
        platform: &mut BettingPlatform,
        bet: &mut Bet,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        
        // Only admin can void bets
        assert!(caller == platform.admin, EUnauthorized);
        assert!(bet.status == STATUS_PENDING, EBetAlreadySettled);

        bet.status = STATUS_VOID;
        bet.settled_at = clock::timestamp_ms(clock);

        // Refund original stake (including fee for voided bets)
        let refund_amount = bet.stake + bet.platform_fee;
        
        if (balance::value(&platform.treasury) >= refund_amount) {
            let refund_balance = balance::split(&mut platform.treasury, refund_amount);
            let refund_coin = coin::from_balance(refund_balance, ctx);
            transfer::public_transfer(refund_coin, bet.bettor);
        };

        event::emit(BetSettled {
            bet_id: object::id(bet),
            bettor: bet.bettor,
            status: STATUS_VOID,
            payout: refund_amount,
            timestamp: bet.settled_at,
        });
    }

    // Add an oracle (admin only)
    public entry fun add_oracle(
        platform: &mut BettingPlatform,
        oracle_address: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        table::add(&mut platform.oracles, oracle_address, true);
    }

    // Remove an oracle (admin only)
    public entry fun remove_oracle(
        platform: &mut BettingPlatform,
        oracle_address: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        table::remove(&mut platform.oracles, oracle_address);
    }

    // Withdraw platform fees (admin only)
    public entry fun withdraw_fees(
        platform: &mut BettingPlatform,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        assert!(balance::value(&platform.treasury) >= amount, EInsufficientBalance);
        
        let withdraw_balance = balance::split(&mut platform.treasury, amount);
        let withdraw_coin = coin::from_balance(withdraw_balance, ctx);
        transfer::public_transfer(withdraw_coin, platform.admin);
    }

    // Update platform fee (admin only)
    public entry fun update_fee(
        platform: &mut BettingPlatform,
        new_fee_bps: u64,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == platform.admin, EUnauthorized);
        assert!(new_fee_bps <= 1000, EInvalidAmount); // Max 10% fee
        platform.platform_fee_bps = new_fee_bps;
    }

    // View functions
    public fun get_bet_status(bet: &Bet): u8 {
        bet.status
    }

    public fun get_bet_stake(bet: &Bet): u64 {
        bet.stake
    }

    public fun get_bet_payout(bet: &Bet): u64 {
        bet.potential_payout
    }

    public fun get_platform_stats(platform: &BettingPlatform): (u64, u64, u64) {
        (platform.total_bets, platform.total_volume, balance::value(&platform.treasury))
    }

    public fun is_oracle(platform: &BettingPlatform, addr: address): bool {
        table::contains(&platform.oracles, addr)
    }

    // For testing - create platform manually
    #[test_only]
    public fun create_platform_for_testing(ctx: &mut TxContext): BettingPlatform {
        BettingPlatform {
            id: object::new(ctx),
            treasury: balance::zero(),
            platform_fee_bps: PLATFORM_FEE_BPS,
            total_bets: 0,
            total_volume: 0,
            admin: tx_context::sender(ctx),
            oracles: table::new(ctx),
        }
    }
}
