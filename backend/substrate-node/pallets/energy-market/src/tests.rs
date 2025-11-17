// backend/substrate-node/pallets/energy-market/src/tests.rs
// Unit tests for energy market pallet

use crate::{mock::*, Error, EnergySource, GridZone};
use frame_support::{assert_noop, assert_ok};

#[test]
fn register_device_works() {
    new_test_ext().execute_with(|| {
        let device_type = EnergySource::Solar;
        let capacity = 1000u32;
        let did_ref = [0u8; 32];

        assert_ok!(EnergyMarket::register_device(
            RuntimeOrigin::signed(1),
            device_type,
            capacity,
            did_ref
        ));

        let devices = EnergyMarket::energy_devices(1);
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].capacity_kwh, capacity);
    });
}

#[test]
fn create_sell_order_requires_verified_device() {
    new_test_ext().execute_with(|| {
        assert_noop!(
            EnergyMarket::create_sell_order(
                RuntimeOrigin::signed(1),
                100,
                1000u128,
                GridZone::NorthAmerica(1),
                EnergySource::Solar,
                1000
            ),
            Error::<Test>::DeviceNotVerified
        );
    });
}

#[test]
fn create_and_buy_order_works() {
    new_test_ext().execute_with(|| {
        // Register and verify device
        let did_ref = [0u8; 32];
        assert_ok!(EnergyMarket::register_device(
            RuntimeOrigin::signed(1),
            EnergySource::Solar,
            1000,
            did_ref
        ));

        // Verify device (as root)
        assert_ok!(EnergyMarket::verify_device(
            RuntimeOrigin::root(),
            1,
            0
        ));

        // Create sell order
        assert_ok!(EnergyMarket::create_sell_order(
            RuntimeOrigin::signed(1),
            100,
            1000u128,
            GridZone::NorthAmerica(1),
            EnergySource::Solar,
            1000
        ));

        // Get order ID (simplified)
        let orders: Vec<_> = EnergyOrders::<Test>::iter().collect();
        assert_eq!(orders.len(), 1);
        let (order_id, _) = orders[0].clone();

        // Buy order
        assert_ok!(EnergyMarket::buy_energy(
            RuntimeOrigin::signed(2),
            order_id
        ));

        // Check balances changed
        let seller_balance = Balances::free_balance(1);
        let buyer_balance = Balances::free_balance(2);
        
        assert!(seller_balance > 100000); // Received payment
        assert!(buyer_balance < 100000);  // Paid for energy
    });
}

#[test]
fn user_stats_updated_correctly() {
    new_test_ext().execute_with(|| {
        // Setup and complete a trade (abbreviated)
        // ... setup code ...

        let stats = EnergyMarket::user_stats(1);
        assert_eq!(stats.total_trades, 1);
        assert!(stats.total_energy_sold > 0);
    });
}