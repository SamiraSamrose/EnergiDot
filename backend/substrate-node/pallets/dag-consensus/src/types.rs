// backend/substrate-node/pallets/dag-consensus/src/types.rs
// Types for DAG consensus pallet

use codec::{Decode, Encode};
use frame_support::BoundedVec;
use scale_info::TypeInfo;
use sp_runtime::RuntimeDebug;

/// DAG vertex
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub struct DagVertex<Hash, BlockNumber> {
    pub vertex_hash: Hash,
    pub parent_refs: BoundedVec<Hash, sp_runtime::traits::ConstU32<8>>,
    pub timestamp: BlockNumber,
    pub transaction_type: TransactionType,
    pub confirmation_count: u32,
    pub finalized: bool,
}

/// Transaction types
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub enum TransactionType {
    EnergyTransfer,
    GridStateUpdate,
    PriceUpdate,
    DeviceStatus,
}

impl Default for TransactionType {
    fn default() -> Self {
        TransactionType::EnergyTransfer
    }
}

/// Grid node
#[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo)]
pub struct GridNode<AccountId, BlockNumber> {
    pub node_id: AccountId,
    pub grid_zone: u32,
    pub is_active: bool,
    pub last_heartbeat: BlockNumber,
    pub vertices_confirmed: u32,
}