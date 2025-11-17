// backend/substrate-node/runtime/src/constants.rs
// Runtime constants

use frame_support::weights::{constants::WEIGHT_PER_SECOND, Weight};
use sp_runtime::Perbill;

/// Money matters
pub mod currency {
    use super::Balance;

    pub const UNITS: Balance = 1_000_000_000_000_000_000; // 18 decimals
    pub const DOLLARS: Balance = UNITS;
    pub const CENTS: Balance = DOLLARS / 100;
    pub const MILLICENTS: Balance = CENTS / 1_000;

    pub const fn deposit(items: u32, bytes: u32) -> Balance {
        items as Balance * 15 * CENTS + (bytes as Balance) * 6 * CENTS
    }
}

/// Time and blocks
pub mod time {
    use super::BlockNumber;

    pub const MILLISECS_PER_BLOCK: u64 = 6000;
    pub const SLOT_DURATION: u64 = MILLISECS_PER_BLOCK;
    
    pub const EPOCH_DURATION_IN_BLOCKS: BlockNumber = 4 * HOURS;
    
    // Time units
    pub const MINUTES: BlockNumber = 60_000 / (MILLISECS_PER_BLOCK as BlockNumber);
    pub const HOURS: BlockNumber = MINUTES * 60;
    pub const DAYS: BlockNumber = HOURS * 24;
}

/// Fee-related
pub mod fee {
    use super::Balance;
    use frame_support::weights::{
        WeightToFeeCoefficient, WeightToFeeCoefficients, WeightToFeePolynomial,
    };
    use smallvec::smallvec;
    pub use sp_runtime::Perbill;

    /// Handles converting a weight scalar to a fee value
    pub struct WeightToFee;
    impl WeightToFeePolynomial for WeightToFee {
        type Balance = Balance;
        fn polynomial() -> WeightToFeeCoefficients<Self::Balance> {
            let p = super::currency::CENTS;
            let q = 10 * Balance::from(ExtrinsicBaseWeight::get().ref_time());
            smallvec![WeightToFeeCoefficient {
                degree: 1,
                negative: false,
                coeff_frac: Perbill::from_rational(p % q, q),
                coeff_integer: p / q,
            }]
        }
    }
}

pub use currency::{CENTS, DOLLARS, MILLICENTS, UNITS};
pub use time::{DAYS, EPOCH_DURATION_IN_BLOCKS, HOURS, MINUTES, SLOT_DURATION};