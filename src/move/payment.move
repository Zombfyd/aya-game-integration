module game::payment {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::balance::{Self, Balance};

    // Error codes
    const EInsufficientPayment: u64 = 0;
    
    // Game payment configuration
    const GAME_PRICE: u64 = 200000000; // 0.2 SUI in MIST
    
    // Payment receipt for tracking
    struct PaymentReceipt has key, store {
        id: UID,
        player: address,
        amount: u64,
        timestamp: u64
    }

    // Event emitted when payment is processed
    struct PaymentProcessed has copy, drop {
        player: address,
        amount: u64,
        timestamp: u64
    }

    // Initialize the module
    fun init(ctx: &mut TxContext) {
        transfer::transfer(
            Coin::from_balance(
                balance::zero<SUI>(),
                ctx
            ),
            tx_context::sender(ctx)
        );
    }

    // Main payment function
    public entry fun pay_for_game(
        payment: &mut Coin<SUI>,
        owner: address,
        ctx: &mut TxContext
    ) {
        let paid_amount = coin::value(payment);
        assert!(paid_amount >= GAME_PRICE, EInsufficientPayment);

        // Split exact payment amount
        let paid_coin = coin::split(payment, GAME_PRICE, ctx);
        
        // Transfer to owner
        transfer::public_transfer(paid_coin, owner);

        // Create and transfer receipt
        let receipt = PaymentReceipt {
            id: object::new(ctx),
            player: tx_context::sender(ctx),
            amount: GAME_PRICE,
            timestamp: tx_context::epoch(ctx)
        };
        transfer::public_transfer(receipt, tx_context::sender(ctx));

        // Emit payment event
        event::emit(PaymentProcessed {
            player: tx_context::sender(ctx),
            amount: GAME_PRICE,
            timestamp: tx_context::epoch(ctx)
        });
    }

    // Helper to get game price
    public fun get_game_price(): u64 {
        GAME_PRICE
    }
}
