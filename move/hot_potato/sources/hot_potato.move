module hot_potato::hot_potato_game {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::vec_set::{Self, VecSet};

    use sbets_token::sbets::SBETS;

    const EGameNotActive: u64 = 0;
    const EGameExpired: u64 = 1;
    const ENotEnoughStake: u64 = 2;
    const ECannotGrabOwnPotato: u64 = 3;
    const EGameAlreadyExploded: u64 = 4;
    const EGameNotExploded: u64 = 5;
    const EUnauthorized: u64 = 6;
    const ETooSoon: u64 = 7;
    const EMaxPlayersReached: u64 = 8;
    const EGameNotStarted: u64 = 9;

    const STATUS_WAITING: u8 = 0;
    const STATUS_ACTIVE: u8 = 1;
    const STATUS_EXPLODED: u8 = 2;
    const STATUS_SETTLED: u8 = 3;

    const MAX_PLAYERS: u64 = 50;
    const MIN_GRAB_INTERVAL_MS: u64 = 3000;

    public struct AdminCap has key, store {
        id: UID,
    }

    public struct HotPotatoGame has key {
        id: UID,
        creator: address,
        event_id: vector<u8>,
        team_a: vector<u8>,
        team_b: vector<u8>,
        pot: Balance<SBETS>,
        min_grab_amount: u64,
        current_holder: address,
        holder_team: u8,
        grab_count: u64,
        player_count: u64,
        player_contributions: vector<PlayerEntry>,
        status: u8,
        timer_duration_ms: u64,
        timer_decrease_ms: u64,
        min_timer_ms: u64,
        last_grab_timestamp_ms: u64,
        created_at_ms: u64,
        game_deadline_ms: u64,
        explosion_time_ms: u64,
    }

    public struct PlayerEntry has store, copy, drop {
        player: address,
        total_contributed: u64,
        grab_count: u64,
        last_team: u8,
    }

    public struct HotPotato has key {
        id: UID,
        game_id: ID,
        holder: address,
        grab_timestamp_ms: u64,
    }

    public struct GameCreated has copy, drop {
        game_id: ID,
        creator: address,
        event_id: vector<u8>,
        min_grab_amount: u64,
        timer_duration_ms: u64,
        game_deadline_ms: u64,
    }

    public struct PotatoGrabbed has copy, drop {
        game_id: ID,
        previous_holder: address,
        new_holder: address,
        amount_added: u64,
        total_pot: u64,
        grab_count: u64,
        current_timer_ms: u64,
        team_chosen: u8,
    }

    public struct GameExploded has copy, drop {
        game_id: ID,
        last_holder: address,
        holder_team: u8,
        total_pot: u64,
        grab_count: u64,
        player_count: u64,
    }

    public struct GameSettled has copy, drop {
        game_id: ID,
        winner: address,
        winner_payout: u64,
        winning_team: u8,
        total_pot: u64,
    }

    public struct PlatformFeeCollected has copy, drop {
        game_id: ID,
        fee_amount: u64,
    }

    fun init(ctx: &mut TxContext) {
        transfer::transfer(
            AdminCap { id: object::new(ctx) },
            tx_context::sender(ctx)
        );
    }

    public entry fun create_game(
        event_id: vector<u8>,
        team_a: vector<u8>,
        team_b: vector<u8>,
        initial_stake: Coin<SBETS>,
        min_grab_amount: u64,
        timer_duration_ms: u64,
        timer_decrease_ms: u64,
        min_timer_ms: u64,
        game_duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        let initial_entry = PlayerEntry {
            player: sender,
            total_contributed: coin::value(&initial_stake),
            grab_count: 1,
            last_team: 0,
        };

        let game = HotPotatoGame {
            id: object::new(ctx),
            creator: sender,
            event_id,
            team_a,
            team_b,
            pot: coin::into_balance(initial_stake),
            min_grab_amount,
            current_holder: sender,
            holder_team: 0,
            grab_count: 1,
            player_count: 1,
            player_contributions: vector[initial_entry],
            status: STATUS_ACTIVE,
            timer_duration_ms,
            timer_decrease_ms,
            min_timer_ms,
            last_grab_timestamp_ms: now,
            created_at_ms: now,
            game_deadline_ms: now + game_duration_ms,
            explosion_time_ms: now + timer_duration_ms,
        };

        event::emit(GameCreated {
            game_id: object::id(&game),
            creator: sender,
            event_id: *&game.event_id,
            min_grab_amount,
            timer_duration_ms,
            game_deadline_ms: game.game_deadline_ms,
        });

        transfer::share_object(game);
    }

    public entry fun grab_potato(
        game: &mut HotPotatoGame,
        stake: Coin<SBETS>,
        team_choice: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        assert!(game.status == STATUS_ACTIVE, EGameNotActive);
        assert!(now < game.game_deadline_ms, EGameExpired);
        assert!(sender != game.current_holder, ECannotGrabOwnPotato);
        assert!(coin::value(&stake) >= game.min_grab_amount, ENotEnoughStake);
        assert!(now >= game.last_grab_timestamp_ms + MIN_GRAB_INTERVAL_MS, ETooSoon);

        if (now >= game.explosion_time_ms) {
            game.status = STATUS_EXPLODED;

            event::emit(GameExploded {
                game_id: object::id(game),
                last_holder: game.current_holder,
                holder_team: game.holder_team,
                total_pot: balance::value(&game.pot),
                grab_count: game.grab_count,
                player_count: game.player_count,
            });

            transfer::public_transfer(stake, sender);
            return
        };

        let amount = coin::value(&stake);
        let previous_holder = game.current_holder;

        balance::join(&mut game.pot, coin::into_balance(stake));

        game.current_holder = sender;
        game.holder_team = team_choice;
        game.grab_count = game.grab_count + 1;
        game.last_grab_timestamp_ms = now;

        let current_timer = game.timer_duration_ms;
        if (current_timer > game.timer_decrease_ms + game.min_timer_ms) {
            game.timer_duration_ms = current_timer - game.timer_decrease_ms;
        } else {
            game.timer_duration_ms = game.min_timer_ms;
        };
        game.explosion_time_ms = now + game.timer_duration_ms;

        let mut found = false;
        let len = vector::length(&game.player_contributions);
        let mut i = 0;
        while (i < len) {
            let entry = vector::borrow_mut(&mut game.player_contributions, i);
            if (entry.player == sender) {
                entry.total_contributed = entry.total_contributed + amount;
                entry.grab_count = entry.grab_count + 1;
                entry.last_team = team_choice;
                found = true;
                break
            };
            i = i + 1;
        };

        if (!found) {
            assert!(game.player_count < MAX_PLAYERS, EMaxPlayersReached);
            let new_entry = PlayerEntry {
                player: sender,
                total_contributed: amount,
                grab_count: 1,
                last_team: team_choice,
            };
            vector::push_back(&mut game.player_contributions, new_entry);
            game.player_count = game.player_count + 1;
        };

        event::emit(PotatoGrabbed {
            game_id: object::id(game),
            previous_holder,
            new_holder: sender,
            amount_added: amount,
            total_pot: balance::value(&game.pot),
            grab_count: game.grab_count,
            current_timer_ms: game.timer_duration_ms,
            team_chosen: team_choice,
        });
    }

    public entry fun check_explosion(
        game: &mut HotPotatoGame,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let now = clock::timestamp_ms(clock);
        assert!(game.status == STATUS_ACTIVE, EGameNotActive);

        if (now >= game.explosion_time_ms || now >= game.game_deadline_ms) {
            game.status = STATUS_EXPLODED;

            event::emit(GameExploded {
                game_id: object::id(game),
                last_holder: game.current_holder,
                holder_team: game.holder_team,
                total_pot: balance::value(&game.pot),
                grab_count: game.grab_count,
                player_count: game.player_count,
            });
        };
    }

    public entry fun settle_game(
        _admin: &AdminCap,
        game: &mut HotPotatoGame,
        winning_team: u8,
        ctx: &mut TxContext
    ) {
        assert!(game.status == STATUS_EXPLODED, EGameNotExploded);

        let total_pot = balance::value(&game.pot);
        let platform_fee = total_pot / 20;
        let winner_pot = total_pot - platform_fee;

        let fee_coin = coin::from_balance(
            balance::split(&mut game.pot, platform_fee),
            ctx
        );
        transfer::public_transfer(fee_coin, tx_context::sender(ctx));

        event::emit(PlatformFeeCollected {
            game_id: object::id(game),
            fee_amount: platform_fee,
        });

        if (game.holder_team == winning_team) {
            let payout = coin::from_balance(
                balance::split(&mut game.pot, winner_pot),
                ctx
            );
            transfer::public_transfer(payout, game.current_holder);

            event::emit(GameSettled {
                game_id: object::id(game),
                winner: game.current_holder,
                winner_payout: winner_pot,
                winning_team,
                total_pot,
            });
        } else {
            let per_player = winner_pot / (game.player_count - 1);
            let remainder = winner_pot - (per_player * (game.player_count - 1));

            let len = vector::length(&game.player_contributions);
            let mut i = 0;
            while (i < len) {
                let entry = vector::borrow(&game.player_contributions, i);
                if (entry.player != game.current_holder) {
                    let share = coin::from_balance(
                        balance::split(&mut game.pot, per_player),
                        ctx
                    );
                    transfer::public_transfer(share, entry.player);
                };
                i = i + 1;
            };

            if (remainder > 0 && balance::value(&game.pot) >= remainder) {
                let rem_coin = coin::from_balance(
                    balance::split(&mut game.pot, remainder),
                    ctx
                );
                transfer::public_transfer(rem_coin, game.creator);
            };

            event::emit(GameSettled {
                game_id: object::id(game),
                winner: @0x0,
                winner_payout: 0,
                winning_team,
                total_pot,
            });
        };

        game.status = STATUS_SETTLED;
    }

    public fun get_game_status(game: &HotPotatoGame): u8 {
        game.status
    }

    public fun get_pot_value(game: &HotPotatoGame): u64 {
        balance::value(&game.pot)
    }

    public fun get_current_holder(game: &HotPotatoGame): address {
        game.current_holder
    }

    public fun get_explosion_time(game: &HotPotatoGame): u64 {
        game.explosion_time_ms
    }

    public fun get_grab_count(game: &HotPotatoGame): u64 {
        game.grab_count
    }
}
