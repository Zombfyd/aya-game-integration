module game::payment {
    use sui::object;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;

    // Error codes
    const EInsufficientPayment: u64 = 0;
    
    // Game payment configuration
    const GAME_PRICE: u64 = 200000000; // 0.2 SUI in MIST
    
    struct PaymentReceipt has key, store {
        id: object::UID,
        player: address,
        amount: u64,
        timestamp: u64
    }

    struct PaymentProcessed has copy, drop {
        player: address,
        amount: u64,
        timestamp: u64
    }

    fun init(ctx: &mut TxContext) {
        let empty_coin = coin::zero<SUI>(ctx);
        transfer::public_transfer(empty_coin, tx_context::sender(ctx));
    }

    public entry fun pay_for_game(
        payment: &mut Coin<SUI>,
        owner: address,
        ctx: &mut TxContext
    ) {
        let paid_amount = coin::value(payment);
        assert!(paid_amount >= GAME_PRICE, EInsufficientPayment);
        
        let paid_coin = coin::split(payment, GAME_PRICE, ctx);
        transfer::public_transfer(paid_coin, owner);

        let receipt = PaymentReceipt {
            id: object::new(ctx),
            player: tx_context::sender(ctx),
            amount: GAME_PRICE,
            timestamp: tx_context::epoch(ctx)
        };
        transfer::public_transfer(receipt, tx_context::sender(ctx));

        event::emit(PaymentProcessed {
            player: tx_context::sender(ctx),
            amount: GAME_PRICE,
            timestamp: tx_context::epoch(ctx)
        });
    }

    public fun get_game_price(): u64 {
        GAME_PRICE
    }
}
