//### Path: `backend/substrate-node/pallets/incentives/src/tests.rs`

// backend/substrate-node/pallets/incentives/src/tests.rs
// Unit tests for incentives pallet

use crate::{mock::*, Error, DataType, ReputationTier};
use frame_support::{assert_noop, assert_ok};

#[test]
fn stake_tokens_works() {
    new_test_ext().execute_with(|| {
        assert_ok!(Incentives::stake_tokens(
            RuntimeOrigin::signed(1),
            1000u128
        ));

        let stake = Incentives::stakes(1).unwrap();
        assert_eq!(stake.staked_amount, 1000);
        assert!(stake.is_active);
    });
}

#[test]
fn stake_below_minimum_fails() {
    new_test_ext().execute_with(|| {
        assert_noop!(
            Incentives::stake_tokens(
                RuntimeOrigin::signed(1),
                50u128
            ),
            Error::<Test>::BelowMinimumStake
        );
    });
}

#[test]
fn claim_rewards_works() {
    new_test_ext().execute_with(|| {
        // Stake tokens
        assert_ok!(Incentives::stake_tokens(
            RuntimeOrigin::signed(1),
            1000u128
        ));

        // Fund reward pool
        assert_ok!(Incentives::fund_reward_pool(
            RuntimeOrigin::signed(2),
            5000u128
        ));

        // Advance blocks
        System::set_block_number(100);

        // Claim rewards
        let balance_before = Balances::free_balance(1);
        assert_ok!(Incentives::claim_rewards(
            RuntimeOrigin::signed(1)
        ));
        let balance_after = Balances::free_balance(1);

        assert!(balance_after > balance_before);
    });
}

#[test]
fn unstake_tokens_works() {
    new_test_ext().execute_with(|| {
        // Stake tokens
        assert_ok!(Incentives::stake_tokens(
            RuntimeOrigin::signed(1),
            1000u128
        ));

        // Unstake
        assert_ok!(Incentives::unstake_tokens(
            RuntimeOrigin::signed(1),
            500u128
        ));

        let stake = Incentives::stakes(1).unwrap();
        assert_eq!(stake.staked_amount, 500);
    });
}

#[test]
fn mint_reputation_nft_works() {
    new_test_ext().execute_with(|| {
        assert_ok!(Incentives::mint_reputation_nft(
            RuntimeOrigin::root(),
            1,
            5000,
            10,
            95
        ));

        let nft = Incentives::reputation_nfts(1).unwrap();
        assert_eq!(nft.tier, ReputationTier::Gold);
        assert_eq!(nft.total_energy_kwh, 5000);
    });
}

#[test]
fn leaderboard_updates_correctly() {
    new_test_ext().execute_with(|| {
        // Mint NFTs for multiple users
        assert_ok!(Incentives::mint_reputation_nft(
            RuntimeOrigin::root(),
            1,
            10000,
            50,
            98
        ));

        assert_ok!(Incentives::mint_reputation_nft(
            RuntimeOrigin::root(),
            2,
            5000,
            25,
            95
        ));

        let leaderboard = Incentives::leaderboard();
        assert_eq!(leaderboard.len(), 2);
        assert_eq!(leaderboard[0].0, 1); // User 1 should be first
    });
}
