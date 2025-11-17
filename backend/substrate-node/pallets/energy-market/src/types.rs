// backend/substrate-node/pallets/energy-market/src/types.rs
// Custom types for energy market pallet

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use sp_runtime::RuntimeDebug;

/// Energy order structure
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub struct EnergyOrder<AccountId, Balance, EnergyAmount, BlockNumber> {
    pub seller: AccountId,
    pub buyer: Option<AccountId>,
    pub energy_amount: EnergyAmount,
    pub price_per_kwh: Balance,
    pub total_price: Balance,
    pub grid_zone: GridZone,
    pub energy_source: EnergySource,
    pub created_at: BlockNumber,
    pub expires_at: BlockNumber,
    pub status: OrderStatus,
}

/// Grid zone identifiers
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub enum GridZone {
    NorthAmerica(u32),
    Europa(u32),
    Asia(u32),
    Custom(u32),
}

impl Default for GridZone {
    fn default() -> Self {
        GridZone::NorthAmerica(0)
    }
}

/// Energy source types
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub enum EnergySource {
    Solar,
    Wind,
    Hydro,
    Geothermal,
    Battery,
    Mixed,
}

impl Default for EnergySource {
    fn default() -> Self {
        EnergySource::Solar
    }
}

/// Order status
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub enum OrderStatus {
    Open,
    Matched,
    Completed,
    Cancelled,
    Expired,
}

impl Default for OrderStatus {
    fn default() -> Self {
        OrderStatus::Open
    }
}

/// Energy device structure
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub struct EnergyDevice<AccountId, BlockNumber> {
    pub owner: AccountId,
    pub device_type: EnergySource,
    pub capacity_kwh: u32,
    pub verified: bool,
    pub did_reference: [u8; 32],
    pub registered_at: BlockNumber,
}

/// User statistics
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, Default)]
pub struct UserStats<EnergyAmount> {
    pub total_energy_sold: EnergyAmount,
    pub total_energy_bought: EnergyAmount,
    pub total_trades: u32,
    pub reputation_score: u32,
}