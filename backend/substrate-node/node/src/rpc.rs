//### Path: `backend/substrate-node/node/src/rpc.rs`

// backend/substrate-node/node/src/rpc.rs
// RPC endpoints

use std::sync::Arc;
use sc_transaction_pool_api::TransactionPool;
use sp_api::ProvideRuntimeApi;
use sp_block_builder::BlockBuilder;
use sp_blockchain::{Error as BlockChainError, HeaderBackend, HeaderMetadata};

pub struct FullDeps<C, P> {
    pub client: Arc<C>,
    pub pool: Arc<P>,
    pub deny_unsafe: sc_rpc::DenyUnsafe,
}

pub fn create_full<C, P>(
    deps: FullDeps<C, P>,
) -> Result<jsonrpc_core::IoHandler<sc_rpc::Metadata>, Box<dyn std::error::Error + Send + Sync>>
where
    C: ProvideRuntimeApi<Block>,
    C: HeaderBackend<Block> + HeaderMetadata<Block, Error = BlockChainError> + 'static,
    C: Send + Sync + 'static,
    C::Api: substrate_frame_rpc_system::AccountNonceApi<Block, AccountId, Index>,
    C::Api: pallet_transaction_payment_rpc::TransactionPaymentRuntimeApi<Block, Balance>,
    C::Api: BlockBuilder<Block>,
    P: TransactionPool + 'static,
{
    use substrate_frame_rpc_system::{System, SystemApiServer};
    use pallet_transaction_payment_rpc::{TransactionPayment, TransactionPaymentApiServer};

    let mut io = jsonrpc_core::IoHandler::default();
    let FullDeps {
        client,
        pool,
        deny_unsafe,
    } = deps;

    io.extend_with(SystemApiServer::to_delegate(System::new(
        client.clone(),
        pool.clone(),
        deny_unsafe,
    )));

    io.extend_with(TransactionPaymentApiServer::to_delegate(
        TransactionPayment::new(client.clone()),
    ));

    Ok(io)
}
