// backend/substrate-node/pallets/incentives/src/types.rs
// Types for incentives pallet

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use sp_runtime::RuntimeDebug;

/// Stake position
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub struct StakePosition<Balance, BlockNumber> {
    pub staked_amount: Balance,
    pub reward_accumulated: Balance,
    pub last_claim_block: BlockNumber,
    pub energy_contributed_kwh: u64,
    pub data_contributions: u32,
    pub is_active: bool,
}

/// Reputation NFT
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub struct ReputationNFT<BlockNumber> {pub tier: ReputationTier,
pub total_energy_kwh: u64,
pub total_trades: u32,
pub sustainability_score: u32,
pub minted_at: BlockNumber,
}
/// Reputation tiers
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub enum ReputationTier {
Bronze,
Silver,
Gold,
Platinum,
Diamond,
}
impl Default for ReputationTier {
fn default() -> Self {
ReputationTier::Bronze
}
}
/// Data contribution
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub struct DataContribution<AccountId, BlockNumber> {
pub contributor: AccountId,
pub data_type: DataType,
pub verified: bool,
pub reward_amount: u64,
pub submitted_at: BlockNumber,
}
/// Data types
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub enum DataType {
SolarProduction,
WindProduction,
GridLoad,
WeatherData,
EVCharging,
BatteryStatus,
}
impl Default for DataType {
fn default() -> Self {
DataType::SolarProduction
}
}