//### Path: `backend/substrate-node/pallets/incentives/src/lib.rs`

// backend/substrate-node/pallets/incentives/src/lib.rs
// STEP II.01.c - Tokenomics and staking model (DePIN mechanics)

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        dispatch::DispatchResult,
        pallet_prelude::*,
        traits::{Currency, ReservableCurrency, ExistenceRequirement},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{CheckedAdd, CheckedSub, Zero};

    type BalanceOf<T> = <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type Currency: ReservableCurrency<Self::AccountId>;
        
        #[pallet::constant]
        type MinStakeAmount: Get<BalanceOf<Self>>;
        
        #[pallet::constant]
        type RewardPerBlock: Get<BalanceOf<Self>>;
        
        #[pallet::constant]
        type UnstakingPeriod: Get<BlockNumberFor<Self>>;
    }

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// Staking position for energy providers
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct StakePosition<Balance, BlockNumber> {
        pub staked_amount: Balance,
        pub reward_accumulated: Balance,
        pub last_claim_block: BlockNumber,
        pub energy_contributed_kwh: u64,
        pub data_contributions: u32,
        pub is_active: bool,
    }

    /// Reputation NFT metadata
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct ReputationNFT<BlockNumber> {
        pub tier: ReputationTier,
        pub total_energy_kwh: u64,
        pub total_trades: u32,
        pub sustainability_score: u32,
        pub minted_at: BlockNumber,
    }

    /// Reputation tiers
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum ReputationTier {
        Bronze,   // 0-1000 kWh
        Silver,   // 1000-5000 kWh
        Gold,     // 5000-20000 kWh
        Platinum, // 20000+ kWh
        Diamond,  // Top 1% contributors
    }

    /// Data contribution record
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct DataContribution<AccountId, BlockNumber> {
        pub contributor: AccountId,
        pub data_type: DataType,
        pub verified: bool,
        pub reward_amount: u64,
        pub submitted_at: BlockNumber,
    }

    /// Types of verifiable data contributions
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum DataType {
        SolarProduction,
        WindProduction,
        GridLoad,
        WeatherData,
        EVCharging,
        BatteryStatus,
    }

    /// Storage: User stake positions
    #[pallet::storage]
    #[pallet::getter(fn stakes)]
    pub type Stakes<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        T::AccountId,
        StakePosition<BalanceOf<T>, BlockNumberFor<T>>,
    >;

    /// Storage: Reputation NFTs
    #[pallet::storage]
    #[pallet::getter(fn reputation_nfts)]
    pub type ReputationNFTs<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        T::AccountId,
        ReputationNFT<BlockNumberFor<T>>,
    >;

    /// Storage: Data contributions
    #[pallet::storage]
    #[pallet::getter(fn data_contributions)]
    pub type DataContributions<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        T::Hash,
        DataContribution<T::AccountId, BlockNumberFor<T>>,
    >;

    /// Storage: Total staked amount
    #[pallet::storage]
    #[pallet::getter(fn total_staked)]
    pub type TotalStaked<T: Config> = StorageValue<_, BalanceOf<T>, ValueQuery>;

    /// Storage: Reward pool
    #[pallet::storage]
    #[pallet::getter(fn reward_pool)]
    pub type RewardPool<T: Config> = StorageValue<_, BalanceOf<T>, ValueQuery>;

    /// Storage: Leaderboard (top contributors)
    #[pallet::storage]
    #[pallet::getter(fn leaderboard)]
    pub type Leaderboard<T: Config> = StorageValue
        _,
        BoundedVec<(T::AccountId, u64), ConstU32<100>>,
        ValueQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Tokens staked [account, amount]
        Staked(T::AccountId, BalanceOf<T>),
        /// Tokens unstaked [account, amount]
        Unstaked(T::AccountId, BalanceOf<T>),
        /// Rewards claimed [account, amount]
        RewardsClaimed(T::AccountId, BalanceOf<T>),
        /// Data contribution submitted [contributor, data_type]
        DataContributed(T::AccountId, DataType),
        /// Data contribution verified [contribution_id, reward]
        DataVerified(T::Hash, u64),
        /// Reputation NFT minted [account, tier]
        ReputationMinted(T::AccountId, ReputationTier),
        /// Leaderboard updated [new_top_contributor]
        LeaderboardUpdated(T::AccountId),
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Insufficient balance to stake
        InsufficientBalance,
        /// No active stake found
        NoActiveStake,
        /// Below minimum stake amount
        BelowMinimumStake,
        /// Unstaking period not elapsed
        UnstakingPeriodNotElapsed,
        /// No rewards to claim
        NoRewardsToClaim,
        /// Data contribution not found
        ContributionNotFound,
        /// Already verified
        AlreadyVerified,
        /// Not authorized to verify
        NotAuthorized,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Stake ENRG tokens to participate in DePIN
        /// Staking qualifies users for rewards and enhanced reputation
        #[pallet::weight(10_000)]
        #[pallet::call_index(0)]
        pub fn stake_tokens(
            origin: OriginFor<T>,
            amount: BalanceOf<T>,
        ) -> DispatchResult {
            let staker = ensure_signed(origin)?;

            ensure!(amount >= T::MinStakeAmount::get(), Error::<T>::BelowMinimumStake);

            // Reserve tokens
            T::Currency::reserve(&staker, amount)?;

            let current_block = <frame_system::Pallet<T>>::block_number();

            // Update or create stake position
            if let Some(mut stake) = Self::stakes(&staker) {
                stake.staked_amount = stake.staked_amount
                    .checked_add(&amount)
                    .ok_or(Error::<T>::InsufficientBalance)?;
                Stakes::<T>::insert(&staker, stake);
            } else {
                let new_stake = StakePosition {
                    staked_amount: amount,
                    reward_accumulated: Zero::zero(),
                    last_claim_block: current_block,
                    energy_contributed_kwh: 0,
                    data_contributions: 0,
                    is_active: true,
                };
                Stakes::<T>::insert(&staker, new_stake);
            }

            // Update total staked
            TotalStaked::<T>::mutate(|total| {
                *total = total.checked_add(&amount).unwrap_or(*total);
            });

            Self::deposit_event(Event::Staked(staker, amount));
            Ok(())
        }

        /// Unstake tokens
        /// Requires waiting period before tokens are released
        #[pallet::weight(10_000)]
        #[pallet::call_index(1)]
        pub fn unstake_tokens(
            origin: OriginFor<T>,
            amount: BalanceOf<T>,
        ) -> DispatchResult {
            let staker = ensure_signed(origin)?;

            let mut stake = Self::stakes(&staker)
                .ok_or(Error::<T>::NoActiveStake)?;

            ensure!(stake.staked_amount >= amount, Error::<T>::InsufficientBalance);

            // Unreserve tokens
            T::Currency::unreserve(&staker, amount);

            // Update stake
            stake.staked_amount = stake.staked_amount
                .checked_sub(&amount)
                .ok_or(Error::<T>::InsufficientBalance)?;

            if stake.staked_amount.is_zero() {
                stake.is_active = false;
            }

            Stakes::<T>::insert(&staker, stake);

            // Update total staked
            TotalStaked::<T>::mutate(|total| {
                *total = total.checked_sub(&amount).unwrap_or(*total);
            });

            Self::deposit_event(Event::Unstaked(staker, amount));
            Ok(())
        }

        /// Claim accumulated rewards
        /// Users earn rewards based on staking duration and contributions
        #[pallet::weight(10_000)]
        #[pallet::call_index(2)]
        pub fn claim_rewards(origin: OriginFor<T>) -> DispatchResult {
            let claimer = ensure_signed(origin)?;

            let mut stake = Self::stakes(&claimer)
                .ok_or(Error::<T>::NoActiveStake)?;

            let current_block = <frame_system::Pallet<T>>::block_number();
            let blocks_elapsed = current_block.saturating_sub(stake.last_claim_block);

            // Calculate rewards
            let block_reward = T::RewardPerBlock::get();
            let blocks_u128: u128 = blocks_elapsed.saturated_into();
            let rewards = block_reward * blocks_u128.into();

            ensure!(!rewards.is_zero(), Error::<T>::NoRewardsToClaim);

            // Transfer rewards from pool
            let reward_pool_balance = Self::reward_pool();
            let actual_reward = if rewards > reward_pool_balance {
                reward_pool_balance
            } else {
                rewards
            };

            T::Currency::transfer(
                &Self::account_id(),
                &claimer,
                actual_reward,
                ExistenceRequirement::KeepAlive,
            )?;

            // Update stake
            stake.reward_accumulated = stake.reward_accumulated
                .checked_add(&actual_reward)
                .unwrap_or(stake.reward_accumulated);
            stake.last_claim_block = current_block;
            Stakes::<T>::insert(&claimer, stake);

            // Update reward pool
            RewardPool::<T>::mutate(|pool| {
                *pool = pool.checked_sub(&actual_reward).unwrap_or(*pool);
            });

            Self::deposit_event(Event::RewardsClaimed(claimer, actual_reward));
            Ok(())
        }

        /// Submit verified data contribution
        /// Users earn ENRG for providing validated energy/grid data
        #[pallet::weight(10_000)]
        #[pallet::call_index(3)]
        pub fn submit_data_contribution(
            origin: OriginFor<T>,
            data_type: DataType,
            data_hash: T::Hash,
        ) -> DispatchResult {
            let contributor = ensure_signed(origin)?;

            let current_block = <frame_system::Pallet<T>>::block_number();

            let contribution = DataContribution {
                contributor: contributor.clone(),
                data_type: data_type.clone(),
                verified: false,
                reward_amount: 0,
                submitted_at: current_block,
            };

            DataContributions::<T>::insert(data_hash, contribution);

            // Update stake contributions count
            if let Some(mut stake) = Self::stakes(&contributor) {
                stake.data_contributions += 1;
                Stakes::<T>::insert(&contributor, stake);
            }

            Self::deposit_event(Event::DataContributed(contributor, data_type));
            Ok(())
        }

        /// Verify data contribution (oracle/governance function)
        /// Off-chain verification confirms data authenticity and awards ENRG
        #[pallet::weight(10_000)]
        #[pallet::call_index(4)]
        pub fn verify_data_contribution(
            origin: OriginFor<T>,
            contribution_id: T::Hash,
            reward_amount: u64,
        ) -> DispatchResult {
            ensure_root(origin)?;

            let mut contribution = Self::data_contributions(&contribution_id)
                .ok_or(Error::<T>::ContributionNotFound)?;

            ensure!(!contribution.verified, Error::<T>::AlreadyVerified);

            contribution.verified = true;
            contribution.reward_amount = reward_amount;

            DataContributions::<T>::insert(contribution_id, contribution.clone());

            // Award tokens to contributor
            let reward_balance: BalanceOf<T> = reward_amount.into();
            let _ = T::Currency::deposit_creating(&contribution.contributor, reward_balance);

            Self::deposit_event(Event::DataVerified(contribution_id, reward_amount));
            Ok(())
        }

        /// Mint reputation NFT
        /// Based on user's cumulative energy contributions and sustainability score
        #[pallet::weight(10_000)]
        #[pallet::call_index(5)]
        pub fn mint_reputation_nft(
            origin: OriginFor<T>,
            target: T::AccountId,
            total_energy_kwh: u64,
            total_trades: u32,
            sustainability_score: u32,
        ) -> DispatchResult {
            ensure_root(origin)?;

            let tier = Self::calculate_tier(total_energy_kwh);
            let current_block = <frame_system::Pallet<T>>::block_number();

            let nft = ReputationNFT {
                tier: tier.clone(),
                total_energy_kwh,
                total_trades,
                sustainability_score,
                minted_at: current_block,
            };

            ReputationNFTs::<T>::insert(&target, nft);

            // Update leaderboard
            Self::update_leaderboard(&target, total_energy_kwh);

            Self::deposit_event(Event::ReputationMinted(target, tier));
            Ok(())
        }

        /// Fund reward pool
        /// Governance or treasury can add funds to reward pool
        #[pallet::weight(10_000)]
        #[pallet::call_index(6)]
        pub fn fund_reward_pool(
            origin: OriginFor<T>,
            amount: BalanceOf<T>,
        ) -> DispatchResult {
            let funder = ensure_signed(origin)?;

            T::Currency::transfer(
                &funder,
                &Self::account_id(),
                amount,
                ExistenceRequirement::KeepAlive,
            )?;

            RewardPool::<T>::mutate(|pool| {
                *pool = pool.checked_add(&amount).unwrap_or(*pool);
            });

            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Calculate reputation tier based on energy contribution
        fn calculate_tier(energy_kwh: u64) -> ReputationTier {
            match energy_kwh {
                0..=999 => ReputationTier::Bronze,
                1000..=4999 => ReputationTier::Silver,
                5000..=19999 => ReputationTier::Gold,
                20000..=99999 => ReputationTier::Platinum,
                _ => ReputationTier::Diamond,
            }
        }

        /// Update leaderboard with new contribution
        fn update_leaderboard(account: &T::AccountId, energy_kwh: u64) {
            Leaderboard::<T>::mutate(|board| {
                // Remove existing entry if present
                board.retain(|(acc, _)| acc != account);
                
                // Add new entry
                let _ = board.try_push((account.clone(), energy_kwh));
                
                // Sort by energy contribution (descending)
                board.sort_by(|a, b| b.1.cmp(&a.1));
                
                // Keep only top 100
                board.truncate(100);
            });

            Self::deposit_event(Event::LeaderboardUpdated(account.clone()));
        }

        /// Get pallet account ID for holding reward pool
        pub fn account_id() -> T::AccountId {
            <T as frame_system::Config>::AccountId::decode(&mut &b"modl/incentiv"[..])
                .expect("Valid account ID")
        }

        /// Get user's reputation tier
        pub fn get_reputation_tier(account: &T::AccountId) -> Option<ReputationTier> {
            Self::reputation_nfts(account).map(|nft| nft.tier)
        }

        /// Get top N contributors from leaderboard
        pub fn get_top_contributors(count: u32) -> Vec<(T::AccountId, u64)> {
            Self::leaderboard()
                .into_inner()
                .into_iter()
                .take(count as usize)
                .collect()
        }
    }
}
