// backend/substrate-node/runtime/src/weights.rs
// Transaction weight calculations

use frame_support::weights::{constants::WEIGHT_PER_SECOND, Weight};

pub const MAXIMUM_BLOCK_WEIGHT: Weight = WEIGHT_PER_SECOND.saturating_mul(2);
pub const NORMAL_DISPATCH_RATIO: frame_support::weights::Perbill = 
    frame_support::weights::Perbill::from_percent(75);
pub const AVERAGE_ON_INITIALIZE_RATIO: frame_support::weights::Perbill =
    frame_support::weights::Perbill::from_percent(10);

// Weight for energy market operations
pub mod energy_market {
    use frame_support::weights::Weight;
    
    pub fn create_order() -> Weight {
        Weight::from_ref_time(50_000_000)
    }
    
    pub fn buy_energy() -> Weight {
        Weight::from_ref_time(100_000_000)
    }
    
    pub fn register_device() -> Weight {
        Weight::from_ref_time(75_000_000)
    }
}

// Weight for DAG consensus operations
pub mod dag_consensus {
    use frame_support::weights::Weight;
    
    pub fn add_vertex() -> Weight {
        Weight::from_ref_time(40_000_000)
    }
    
    pub fn confirm_vertex() -> Weight {
        Weight::from_ref_time(30_000_000)
    }
}

// Weight for incentives operations
pub mod incentives {
    use frame_support::weights::Weight;
    
    pub fn stake_tokens() -> Weight {
        Weight::from_ref_time(60_000_000)
    }
    
    pub fn claim_rewards() -> Weight {
        Weight::from_ref_time(80_000_000)
    }
}