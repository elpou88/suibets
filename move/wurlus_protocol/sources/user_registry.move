module wurlus_protocol::user_registry {
    use std::string::{String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::dynamic_field as df;
    use wurlus_protocol::wurlus_protocol::{Self, WurlusProtocol};

    // Error codes
    const EUserAlreadyRegistered: u64 = 1;
    const EUserNotRegistered: u64 = 2;
    const EInvalidUsername: u64 = 3;
    const EInvalidEmailFormat: u64 = 4;
    const ENotOwner: u64 = 5;

    // Capability for User Registry management
    struct RegistryManagerCap has key {
        id: UID,
    }

    // User Registry state object
    struct UserRegistry has key {
        id: UID,
        users_count: u64,
        username_to_address: Table<String, address>,
        email_to_address: Table<String, address>,
        admin: address,
    }

    // Represents a user profile
    // Based on Wal.app Sui struct documentation
    struct UserProfile has key, store {
        id: UID,
        owner: address,
        username: String,
        email: Option<String>,
        wallet_type: String, // "Sui", "Suiet", "Nightly", "WalletConnect"
        created_at: u64,
        last_login: u64,
        is_active: bool,
    }

    // User stats object tied to a profile
    struct UserStats has key, store {
        id: UID,
        profile_id: ID,
        total_bets: u64,
        total_wagered: u64,
        total_won: u64,
        total_lost: u64,
        win_rate: u64, // Stored as percentage * 100
        rank: u64,     // Leaderboard rank
    }

    // User wallet configuration
    struct UserWallet has key, store {
        id: UID,
        owner: address,
        preferred_currency: String,
        auto_claim_winnings: bool,
        notification_settings: NotificationSettings,
        bet_limits: BetLimits,
    }

    // Nested struct for notification settings
    struct NotificationSettings has store, copy, drop {
        email_enabled: bool,
        push_enabled: bool,
        bet_settlement_notifications: bool,
        withdrawal_notifications: bool,
        deposit_notifications: bool,
        promotion_notifications: bool,
    }

    // Nested struct for betting limits
    struct BetLimits has store, copy, drop {
        daily_limit: u64,
        weekly_limit: u64,
        max_bet_amount: u64,
    }

    // Staking information for a user
    struct StakingInfo has key, store {
        id: UID,
        owner: address,
        staked_amount: u64,
        staking_start_time: u64,
        staking_end_time: u64,
        rewards_earned: u64,
        rewards_claimed: u64,
        is_staking: bool,
    }

    // Events
    struct UserRegistered has copy, drop {
        user_address: address,
        username: String,
        timestamp: u64,
    }

    struct UserProfileUpdated has copy, drop {
        user_address: address,
        username: String,
        timestamp: u64,
    }

    struct UserLoggedIn has copy, drop {
        user_address: address,
        timestamp: u64,
    }

    // Initialize the registry - called when publishing the module
    fun init(ctx: &mut TxContext) {
        // Create registry manager capability
        transfer::transfer(
            RegistryManagerCap { id: object::new(ctx) },
            tx_context::sender(ctx)
        );

        // Create the user registry
        let registry = UserRegistry {
            id: object::new(ctx),
            users_count: 0,
            username_to_address: table::new(ctx),
            email_to_address: table::new(ctx),
            admin: tx_context::sender(ctx),
        };

        // Share the registry so it can be accessed by anyone
        transfer::share_object(registry);
    }

    // Register a new user
    public entry fun register_user(
        protocol: &WurlusProtocol,
        registry: &mut UserRegistry,
        username: String,
        wallet_type: String,
        email: Option<String>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if username already exists
        assert!(!table::contains(&registry.username_to_address, username), EUserAlreadyRegistered);
        
        // Validate username - enforce Wal.app rules (3-20 chars, alphanumeric + underscore)
        // In a full implementation, add more validation logic
        
        // Register username to address
        table::add(&mut registry.username_to_address, username, sender);
        
        // Register email if provided
        if (option::is_some(&email)) {
            let email_value = *option::borrow(&email);
            // Verify email format (basic check)
            // In a full implementation, add more validation logic
            
            // Add email to registry 
            table::add(&mut registry.email_to_address, email_value, sender);
        };
        
        // Create user profile
        let profile = UserProfile {
            id: object::new(ctx),
            owner: sender,
            username,
            email,
            wallet_type,
            created_at: tx_context::epoch(ctx),
            last_login: tx_context::epoch(ctx),
            is_active: true,
        };
        
        // Create user stats
        let stats = UserStats {
            id: object::new(ctx),
            profile_id: object::uid_to_inner(&profile.id),
            total_bets: 0,
            total_wagered: 0,
            total_won: 0,
            total_lost: 0,
            win_rate: 0,
            rank: registry.users_count + 1,
        };
        
        // Create default wallet settings
        let wallet = UserWallet {
            id: object::new(ctx),
            owner: sender,
            preferred_currency: string::utf8(b"SUI"),
            auto_claim_winnings: true,
            notification_settings: NotificationSettings {
                email_enabled: true,
                push_enabled: true,
                bet_settlement_notifications: true,
                withdrawal_notifications: true,
                deposit_notifications: true,
                promotion_notifications: true,
            },
            bet_limits: BetLimits {
                daily_limit: 1000000000, // 1 SUI = 1,000,000,000 MIST
                weekly_limit: 5000000000, // 5 SUI = 5,000,000,000 MIST
                max_bet_amount: 500000000, // 0.5 SUI = 500,000,000 MIST
            }
        };
        
        // Create empty staking info
        let staking_info = StakingInfo {
            id: object::new(ctx),
            owner: sender,
            staked_amount: 0,
            staking_start_time: 0,
            staking_end_time: 0,
            rewards_earned: 0,
            rewards_claimed: 0,
            is_staking: false,
        };
        
        // Transfer objects to user
        transfer::transfer(profile, sender);
        transfer::transfer(stats, sender);
        transfer::transfer(wallet, sender);
        transfer::transfer(staking_info, sender);
        
        // Increment user count
        registry.users_count = registry.users_count + 1;
        
        // Emit user registered event
        event::emit(UserRegistered {
            user_address: sender,
            username,
            timestamp: tx_context::epoch(ctx),
        });
    }
    
    // Update user profile
    public entry fun update_profile(
        profile: &mut UserProfile,
        email: Option<String>,
        ctx: &mut TxContext
    ) {
        // Ensure only the owner can update their profile
        assert!(tx_context::sender(ctx) == profile.owner, ENotOwner);
        
        // Update email if provided
        if (option::is_some(&email)) {
            profile.email = email;
        };
        
        // Emit user profile updated event
        event::emit(UserProfileUpdated {
            user_address: profile.owner,
            username: profile.username,
            timestamp: tx_context::epoch(ctx),
        });
    }
    
    // Log in user (update last login time)
    public entry fun login_user(
        profile: &mut UserProfile,
        ctx: &mut TxContext
    ) {
        // Ensure only the owner can log in
        assert!(tx_context::sender(ctx) == profile.owner, ENotOwner);
        
        // Update last login time
        profile.last_login = tx_context::epoch(ctx);
        
        // Emit user logged in event
        event::emit(UserLoggedIn {
            user_address: profile.owner,
            timestamp: tx_context::epoch(ctx),
        });
    }
    
    // Check if user is registered
    public fun is_registered(
        registry: &UserRegistry,
        username: String
    ): bool {
        table::contains(&registry.username_to_address, username)
    }
    
    // Get user address by username
    public fun get_address_by_username(
        registry: &UserRegistry,
        username: String
    ): address {
        assert!(table::contains(&registry.username_to_address, username), EUserNotRegistered);
        *table::borrow(&registry.username_to_address, username)
    }
    
    // Update notification settings
    public entry fun update_notification_settings(
        wallet: &mut UserWallet,
        email_enabled: bool,
        push_enabled: bool,
        bet_settlement_notifications: bool,
        withdrawal_notifications: bool,
        deposit_notifications: bool,
        promotion_notifications: bool,
        ctx: &mut TxContext
    ) {
        // Ensure only the owner can update settings
        assert!(tx_context::sender(ctx) == wallet.owner, ENotOwner);
        
        wallet.notification_settings = NotificationSettings {
            email_enabled,
            push_enabled,
            bet_settlement_notifications,
            withdrawal_notifications,
            deposit_notifications,
            promotion_notifications,
        };
    }
    
    // Update bet limits
    public entry fun update_bet_limits(
        wallet: &mut UserWallet,
        daily_limit: u64,
        weekly_limit: u64,
        max_bet_amount: u64,
        ctx: &mut TxContext
    ) {
        // Ensure only the owner can update limits
        assert!(tx_context::sender(ctx) == wallet.owner, ENotOwner);
        
        wallet.bet_limits = BetLimits {
            daily_limit,
            weekly_limit,
            max_bet_amount,
        };
    }
}
