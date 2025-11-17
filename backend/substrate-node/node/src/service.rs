// backend/substrate-node/node/src/service.rs
// Service configuration

use sc_service::{error::Error as ServiceError, Configuration, TaskManager};
use std::sync::Arc;

pub type Block = sp_runtime::generic::Block<Header, UncheckedExtrinsic>;
pub type Header = sp_runtime::generic::Header<BlockNumber, BlakeTwo256>;
pub type UncheckedExtrinsic = sp_runtime::generic::UncheckedExtrinsic<Address, Call, Signature, SignedExtra>;

pub fn new_full(config: Configuration) -> Result<TaskManager, ServiceError> {
    let sc_service::PartialComponents {
        client,
        backend,
        mut task_manager,
        import_queue,
        keystore_container,
        select_chain,
        transaction_pool,
        other: (block_import, grandpa_link, mut telemetry),
    } = new_partial(&config)?;

    let (network, system_rpc_tx, network_starter) =
        sc_service::build_network(sc_service::BuildNetworkParams {
            config: &config,
            client: client.clone(),
            transaction_pool: transaction_pool.clone(),
            spawn_handle: task_manager.spawn_handle(),
            import_queue,
            block_announce_validator_builder: None,
            warp_sync: None,
        })?;

    if config.offchain_worker.enabled {
        sc_service::build_offchain_workers(
            &config,
            task_manager.spawn_handle(),
            client.clone(),
            network.clone(),
        );
    }

    let role = config.role.clone();
    let prometheus_registry = config.prometheus_registry().cloned();

    let rpc_extensions_builder = {
        let client = client.clone();
        let pool = transaction_pool.clone();

        Box::new(move |deny_unsafe, _| {
            let deps = crate::rpc::FullDeps {
                client: client.clone(),
                pool: pool.clone(),
                deny_unsafe,
            };

            crate::rpc::create_full(deps).map_err(Into::into)
        })
    };

    sc_service::spawn_tasks(sc_service::SpawnTasksParams {
        config,
        backend,
        client: client.clone(),
        network: network.clone(),
        keystore: keystore_container.sync_keystore(),
        rpc_extensions_builder,
        transaction_pool: transaction_pool.clone(),
        task_manager: &mut task_manager,
        system_rpc_tx,
        telemetry: telemetry.as_mut(),
    })?;

    if role.is_authority() {
        let proposer_factory = sc_basic_authorship::ProposerFactory::new(
            task_manager.spawn_handle(),
            client.clone(),
            transaction_pool,
            prometheus_registry.as_ref(),
            telemetry.as_ref().map(|x| x.handle()),
        );

        let can_author_with =
            sp_consensus::CanAuthorWithNativeVersion::new(client.executor().clone());

        let slot_duration = sc_consensus_aura::slot_duration(&*client)?;

        let aura = sc_consensus_aura::start_aura::<AuraPair, _, _, _, _, _, _, _, _, _, _, _>(
            sc_consensus_aura::StartAuraParams {slot_duration,
client,
select_chain,
block_import,
proposer_factory,
create_inherent_data_providers: move |_, ()| async move {
let timestamp = sp_timestamp::InherentDataProvider::from_system_time();
Ok(timestamp)
},
force_authoring: false,
backoff_authoring_blocks: None,
keystore: keystore_container.sync_keystore(),
can_author_with,
sync_oracle: network.clone(),
justification_sync_link: network.clone(),
block_proposal_slot_portion: sc_consensus_aura::SlotProportion::new(2f32 / 3f32),
max_block_proposal_slot_portion: None,
telemetry: telemetry.as_ref().map(|x| x.handle()),
},
)?;
        task_manager.spawn_essential_handle().spawn_blocking("aura", None, aura);
}

let grandpa_config = sc_finality_grandpa::Config {
    gossip_duration: std::time::Duration::from_millis(333),
    justification_period: 512,
    name: None,
    observer_enabled: false,
    keystore: Some(keystore_container.sync_keystore()),
    local_role: role,
    telemetry: telemetry.as_ref().map(|x| x.handle()),
    protocol_name: sc_finality_grandpa::protocol_standard_name(
        &client.block_hash(0)?.expect("Genesis block exists; qed"),
        &config.chain_spec,
    ),
};

if !role.is_authority() {
    task_manager.spawn_handle().spawn(
        "grandpa-observer",
        None,
        sc_finality_grandpa::run_grandpa_observer(grandpa_config, grandpa_link, network)?,
    );
} else {
    let grandpa = sc_finality_grandpa::run_grandpa_voter(
        grandpa_config,
        grandpa_link,
        network,
        voting_rule,
        prometheus_registry,
        shared_voter_state,
    )?;

    task_manager
        .spawn_essential_handle()
        .spawn_blocking("grandpa-voter", None, grandpa);
}

network_starter.start_network();
Ok(task_manager)
}
fn new_partial(
config: &Configuration,
) -> Result
sc_service::PartialComponents
FullClient,
FullBackend,
FullSelectChain,
sc_consensus::DefaultImportQueue<Block, FullClient>,
sc_transaction_pool::FullPool<Block, FullClient>,
(
sc_consensus_aura::AuraBlockImport
Block,
FullClient,
sc_finality_grandpa::GrandpaBlockImport<FullBackend, Block, FullClient, FullSelectChain>,
AuraPair,
>,
sc_finality_grandpa::LinkHalf<Block, FullClient, FullSelectChain>,
Option<Telemetry>,
),
>,
ServiceError,

{
let telemetry = config
.telemetry_endpoints
.clone()
.filter(|x| !x.is_empty())
.map(|endpoints| -> Result<_, sc_telemetry::Error> {
let worker = TelemetryWorker::new(16)?;
let telemetry = worker.handle().new_telemetry(endpoints);
Ok((worker, telemetry))
})
.transpose()?;
let executor = NativeElseWasmExecutor::<ExecutorDispatch>::new(
    config.wasm_method,
    config.default_heap_pages,
    config.max_runtime_instances,
    config.runtime_cache_size,
);

let (client, backend, keystore_container, task_manager) =
    sc_service::new_full_parts::<Block, RuntimeApi, _>(
        config,
        telemetry.as_ref().map(|(_, telemetry)| telemetry.handle()),
        executor,
    )?;
let client = Arc::new(client);

let telemetry = telemetry.map(|(worker, telemetry)| {
    task_manager
        .spawn_handle()
        .spawn("telemetry", None, worker.run());
    telemetry
});

let select_chain = sc_consensus::LongestChain::new(backend.clone());

let transaction_pool = sc_transaction_pool::BasicPool::new_full(
    config.transaction_pool.clone(),
    config.role.is_authority().into(),
    config.prometheus_registry(),
    task_manager.spawn_essential_handle(),
    client.clone(),
);

let (grandpa_block_import, grandpa_link) = sc_finality_grandpa::block_import(
    client.clone(),
    &(client.clone() as Arc<_>),
    select_chain.clone(),
    telemetry.as_ref().map(|x| x.handle()),
)?;

let slot_duration = sc_consensus_aura::slot_duration(&*client)?;

let import_queue =
    sc_consensus_aura::import_queue::<AuraPair, _, _, _, _, _, _>(
        sc_consensus_aura::ImportQueueParams {
            block_import: grandpa_block_import.clone(),
            justification_import: Some(Box::new(grandpa_block_import.clone())),
            client: client.clone(),
            create_inherent_data_providers: move |_, ()| async move {
                let timestamp = sp_timestamp::InherentDataProvider::from_system_time();
                Ok(timestamp)
            },
            spawner: &task_manager.spawn_essential_handle(),
            registry: config.prometheus_registry(),
            can_author_with: sp_consensus::CanAuthorWithNativeVersion::new(
                client.executor().clone(),
            ),
            check_for_equivocation: Default::default(),
            telemetry: telemetry.as_ref().map(|x| x.handle()),
        },
    )?;

Ok(sc_service::PartialComponents {
    client,
    backend,
    task_manager,
    import_queue,
    keystore_container,
    select_chain,
    transaction_pool,
    other: (grandpa_block_import, grandpa_link, telemetry),
})
}
