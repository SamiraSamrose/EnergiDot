// backend/substrate-node/pallets/energy-market/src/lib.rs
// STEP II.01.a - Peer-to-peer microgrid trading logic with live ENTSO-E and EIA data integration

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        dispatch::DispatchResult,
        pallet_prelude::*,
        traits::{Currency, ReservableCurrency},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{AtLeast32BitUnsigned, CheckedAdd, CheckedSub, Zero};
    use sp_std::vec::Vec;

    type BalanceOf<T> = <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type Currency: ReservableCurrency<Self::AccountId>;
        type EnergyAmount: Parameter + Member + AtLeast32BitUnsigned + Default + Copy + MaxEncodedLen;
        
        #[pallet::constant]
        type MaxTradesPerBlock: Get<u32>;
        
        #[pallet::constant]
        type MinTradeAmount: Get<BalanceOf<Self>>;
    }

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// Energy trade order structure
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct EnergyOrder<AccountId, Balance, EnergyAmount, BlockNumber> {
        pub seller: AccountId,
        pub buyer: Option<AccountId>,
        pub energy_amount: EnergyAmount, // in kWh
        pub price_per_kwh: Balance,
        pub total_price: Balance,
        pub grid_zone: GridZone,
        pub energy_source: EnergySource,
        pub created_at: BlockNumber,
        pub expires_at: BlockNumber,
        pub status: OrderStatus,
    }

    /// Grid zone identifiers (based on ENTSO-E zones)
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum GridZone {
        NorthAmerica(u32), // EIA regions
        Europe(u32),       // ENTSO-E bidding zones
        Asia(u32),
        Custom(u32),
    }

    /// Energy source types
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum EnergySource {
        Solar,
        Wind,
        Hydro,
        Geothermal,
        Battery,
        Mixed,
    }

    /// Order status
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum OrderStatus {
        Open,
        Matched,
        Completed,
        Cancelled,
        Expired,
    }

    /// Device verification structure (DID-linked)
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct EnergyDevice<AccountId, BlockNumber> {
        pub owner: AccountId,
        pub device_type: EnergySource,
        pub capacity_kwh: u32,
        pub verified: bool,
        pub did_reference: [u8; 32], // Reference to DID pallet
        pub registered_at: BlockNumber,
    }

    /// Storage: Active energy orders
    #[pallet::storage]
    #[pallet::getter(fn energy_orders)]
    pub type EnergyOrders<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        T::Hash,
        EnergyOrder<T::AccountId, BalanceOf<T>, T::EnergyAmount, BlockNumberFor<T>>,
    >;

    /// Storage: Verified energy devices
    #[pallet::storage]
    #[pallet::getter(fn energy_devices)]
    pub type EnergyDevices<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        T::AccountId,
        Vec<EnergyDevice<T::AccountId, BlockNumberFor<T>>>,
        ValueQuery,
    >;

    /// Storage: Grid zone pricing data (updated via oracle/data aggregator)
    #[pallet::storage]
    #[pallet::getter(fn grid_prices)]
    pub type GridPrices<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        GridZone,
        BalanceOf<T>,
    >;

    /// Storage: User energy contribution stats
    #[pallet::storage]
    #[pallet::getter(fn user_stats)]
    pub type UserEnergyStats<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        T::AccountId,
        UserStats<T::EnergyAmount>,
        ValueQuery,
    >;

    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen, Default)]
    pub struct UserStats<EnergyAmount> {
        pub total_energy_sold: EnergyAmount,
        pub total_energy_bought: EnergyAmount,
        pub total_trades: u32,
        pub reputation_score: u32,
    }

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Energy order created [order_id, seller, amount]
        OrderCreated(T::Hash, T::AccountId, T::EnergyAmount),
        /// Order matched [order_id, buyer]
        OrderMatched(T::Hash, T::AccountId),
        /// Trade completed [order_id, seller, buyer, amount]
        TradeCompleted(T::Hash, T::AccountId, T::AccountId, T::EnergyAmount),
        /// Device registered [owner, device_type]
        DeviceRegistered(T::AccountId, EnergySource),
        /// Device verified [owner, device_id]
        DeviceVerified(T::AccountId, u32),
        /// Grid price updated [zone, price]
        GridPriceUpdated(GridZone, BalanceOf<T>),
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Order not found
        OrderNotFound,
        /// Insufficient balance
        InsufficientBalance,
        /// Order already matched
        OrderAlreadyMatched,
        /// Not the order seller
        NotOrderSeller,
        /// Device not verified
        DeviceNotVerified,
        /// Invalid trade amount
        InvalidTradeAmount,
        /// Grid zone not supported
        GridZoneNotSupported,
        /// Maximum trades per block exceeded
        TooManyTrades,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create energy sell order
        /// This function allows verified device owners to list energy for sale
        #[pallet::weight(10_000)]
        #[pallet::call_index(0)]
        pub fn create_sell_order(
            origin: OriginFor<T>,
            energy_amount: T::EnergyAmount,
            price_per_kwh: BalanceOf<T>,
            grid_zone: GridZone,
            energy_source: EnergySource,
            expires_in_blocks: BlockNumberFor<T>,
        ) -> DispatchResult {
            let seller = ensure_signed(origin)?;

            // Verify user has registered device
            let devices = Self::energy_devices(&seller);
            ensure!(!devices.is_empty(), Error::<T>::DeviceNotVerified);
            ensure!(devices.iter().any(|d| d.verified), Error::<T>::DeviceNotVerified);

            // Calculate total price
            let energy_amount_u128: u128 = energy_amount.try_into().ok().unwrap_or(0u128);
            let total_price = price_per_kwh * energy_amount_u128.into();

            ensure!(total_price >= T::MinTradeAmount::get(), Error::<T>::InvalidTradeAmount);

            let current_block = <frame_system::Pallet<T>>::block_number();
            let expires_at = current_block + expires_in_blocks;

            let order = EnergyOrder {
                seller: seller.clone(),
                buyer: None,
                energy_amount,
                price_per_kwh,
                total_price,
                grid_zone: grid_zone.clone(),
                energy_source: energy_source.clone(),
                created_at: current_block,
                expires_at,
                status: OrderStatus::Open,
            };

            let order_id = T::Hashing::hash_of(&order);
            EnergyOrders::<T>::insert(order_id, order);

            Self::deposit_event(Event::OrderCreated(order_id, seller, energy_amount));
            Ok(())
        }

        /// Match and execute energy buy order
        /// This function allows buyers to purchase listed energy
        #[pallet::weight(10_000)]
        #[pallet::call_index(1)]
        pub fn buy_energy(
            origin: OriginFor<T>,
            order_id: T::Hash,
        ) -> DispatchResult {
            let buyer = ensure_signed(origin)?;

            let mut order = Self::energy_orders(&order_id)
                .ok_or(Error::<T>::OrderNotFound)?;

            ensure!(order.status == OrderStatus::Open, Error::<T>::OrderAlreadyMatched);
            ensure!(order.seller != buyer, Error::<T>::NotOrderSeller);

            // Transfer payment from buyer to seller
            T::Currency::transfer(
                &buyer,
                &order.seller,
                order.total_price,
                frame_support::traits::ExistenceRequirement::KeepAlive,
            )?;

            // Update order status
            order.buyer = Some(buyer.clone());
            order.status = OrderStatus::Matched;
            EnergyOrders::<T>::insert(order_id, order.clone());

            // Update user statistics
            Self::update_user_stats(&order.seller, order.energy_amount, true);
            Self::update_user_stats(&buyer, order.energy_amount, false);

            Self::deposit_event(Event::OrderMatched(order_id, buyer.clone()));
            Self::deposit_event(Event::TradeCompleted(
                order_id,
                order.seller,
                buyer,
                order.energy_amount,
            ));

            Ok(())
        }

        /// Register energy-producing device with DID reference
        /// Links physical devices to on-chain identity
        #[pallet::weight(10_000)]
        #[pallet::call_index(2)]
        pub fn register_device(
            origin: OriginFor<T>,
            device_type: EnergySource,
            capacity_kwh: u32,
            did_reference: [u8; 32],
        ) -> DispatchResult {
            let owner = ensure_signed(origin)?;

            let current_block = <frame_system::Pallet<T>>::block_number();
            
            let device = EnergyDevice {
                owner: owner.clone(),
                device_type: device_type.clone(),
                capacity_kwh,
                verified: false, // Requires off-chain verification
                did_reference,
                registered_at: current_block,
            };

            EnergyDevices::<T>::mutate(&owner, |devices| {
                devices.push(device);
            });

            Self::deposit_event(Event::DeviceRegistered(owner, device_type));
            Ok(())
        }

        /// Verify device (called by oracle or governance)
        /// Off-chain verification confirms device authenticity
        #[pallet::weight(10_000)]
        #[pallet::call_index(3)]
        pub fn verify_device(
            origin: OriginFor<T>,
            device_owner: T::AccountId,
            device_index: u32,
        ) -> DispatchResult {
            ensure_root(origin)?;

            EnergyDevices::<T>::mutate(&device_owner, |devices| {
                if let Some(device) = devices.get_mut(device_index as usize) {
                    device.verified = true;
                }
            });

            Self::deposit_event(Event::DeviceVerified(device_owner, device_index));
            Ok(())
        }

        /// Update grid zone pricing (oracle function)
        /// Updates market prices based on external data feeds (ENTSO-E, EIA)
        #[pallet::weight(10_000)]
        #[pallet::call_index(4)]
        pub fn update_grid_price(
            origin: OriginFor<T>,
            grid_zone: GridZone,
            price: BalanceOf<T>,
        ) -> DispatchResult {
            ensure_root(origin)?;

            GridPrices::<T>::insert(grid_zone.clone(), price);
            Self::deposit_event(Event::GridPriceUpdated(grid_zone, price));
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Helper function to update user statistics
        fn update_user_stats(account: &T::AccountId, energy_amount: T::EnergyAmount, is_seller: bool) {
            UserEnergyStats::<T>::mutate(account, |stats| {
                if is_seller {
                    stats.total_energy_sold = stats.total_energy_sold
                        .checked_add(&energy_amount)
                        .unwrap_or(stats.total_energy_sold);
                } else {
                    stats.total_energy_bought = stats.total_energy_bought
                        .checked_add(&energy_amount)
                        .unwrap_or(stats.total_energy_bought);
                }
                stats.total_trades += 1;
                stats.reputation_score += 1; // Simple reputation increment
            });
        }

        /// Get current grid price for a zone
        pub fn get_grid_price(grid_zone: &GridZone) -> Option<BalanceOf<T>> {
            Self::grid_prices(grid_zone)
        }

        /// Check if user has verified devices
        pub fn has_verified_device(account: &T::AccountId) -> bool {
            let devices = Self::energy_devices(account);
            devices.iter().any(|d| d.verified)
        }
    }
}