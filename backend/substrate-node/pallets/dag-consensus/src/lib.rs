// backend/substrate-node/pallets/dag-consensus/src/lib.rs
// STEP II.01.b - Fast DAG-based consensus for local energy node coordination

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        dispatch::DispatchResult,
        pallet_prelude::*,
    };
    use frame_system::pallet_prelude::*;
    use sp_std::vec::Vec;

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        #[pallet::constant]
        type MaxParentRefs: Get<u32>;
        
        #[pallet::constant]
        type MaxDagDepth: Get<u32>;
    }

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// DAG vertex representing an energy transaction or state update
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct DagVertex<Hash, BlockNumber> {
        pub vertex_hash: Hash,
        pub parent_refs: BoundedVec<Hash, ConstU32<8>>, // Multiple parents for DAG structure
        pub timestamp: BlockNumber,
        pub transaction_type: TransactionType,
        pub confirmation_count: u32,
        pub finalized: bool,
    }

    /// Transaction types in DAG
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum TransactionType {
        EnergyTransfer,
        GridStateUpdate,
        PriceUpdate,
        DeviceStatus,
    }

    /// Local grid coordinator node
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct GridNode<AccountId, BlockNumber> {
        pub node_id: AccountId,
        pub grid_zone: u32,
        pub is_active: bool,
        pub last_heartbeat: BlockNumber,
        pub vertices_confirmed: u32,
    }

    /// Storage: DAG vertices
    #[pallet::storage]
    #[pallet::getter(fn dag_vertices)]
    pub type DagVertices<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        T::Hash,
        DagVertex<T::Hash, BlockNumberFor<T>>,
    >;

    /// Storage: Grid coordinator nodes
    #[pallet::storage]
    #[pallet::getter(fn grid_nodes)]
    pub type GridNodes<T: Config> = StorageMap
        _,
        Blake2_128Concat,
        T::AccountId,
        GridNode<T::AccountId, BlockNumberFor<T>>,
    >;

    /// Storage: DAG tips (vertices without children)
    #[pallet::storage]
    #[pallet::getter(fn dag_tips)]
    pub type DagTips<T: Config> = StorageValue<_, BoundedVec<T::Hash, ConstU32<100>>, ValueQuery>;

    /// Storage: Finalized vertex count
    #[pallet::storage]
    #[pallet::getter(fn finalized_count)]
    pub type FinalizedCount<T: Config> = StorageValue<_, u32, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// New DAG vertex added [vertex_hash]
        VertexAdded(T::Hash),
        /// Vertex confirmed [vertex_hash, confirmation_count]
        VertexConfirmed(T::Hash, u32),
        /// Vertex finalized [vertex_hash]
        VertexFinalized(T::Hash),
        /// Grid node registered [node_id, zone]
        GridNodeRegistered(T::AccountId, u32),
        /// Node heartbeat [node_id]
        NodeHeartbeat(T::AccountId),
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Vertex not found
        VertexNotFound,
        /// Invalid parent reference
        InvalidParentRef,
        /// Maximum parents exceeded
        TooManyParents,
        /// Vertex already finalized
        AlreadyFinalized,
        /// Not a grid node
        NotGridNode,
        /// DAG depth exceeded
        DagDepthExceeded,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Add new vertex to DAG
        /// Implements low-latency local consensus for energy transactions
        #[pallet::weight(10_000)]
        #[pallet::call_index(0)]
        pub fn add_vertex(
            origin: OriginFor<T>,
            parent_hashes: Vec<T::Hash>,
            transaction_type: TransactionType,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            // Validate parent references
            ensure!(
                parent_hashes.len() <= T::MaxParentRefs::get() as usize,
                Error::<T>::TooManyParents
            );

            for parent_hash in &parent_hashes {
                ensure!(
                    Self::dag_vertices(parent_hash).is_some(),
                    Error::<T>::InvalidParentRef
                );
            }

            let current_block = <frame_system::Pallet<T>>::block_number();

            // Create vertex
            let parent_refs: BoundedVec<T::Hash, ConstU32<8>> = parent_hashes
                .try_into()
                .map_err(|_| Error::<T>::TooManyParents)?;

            let vertex = DagVertex {
                vertex_hash: T::Hash::default(), // Will be set after hashing
                parent_refs: parent_refs.clone(),
                timestamp: current_block,
                transaction_type,
                confirmation_count: 0,
                finalized: false,
            };

            let vertex_hash = T::Hashing::hash_of(&vertex);
            let mut vertex_final = vertex;
            vertex_final.vertex_hash = vertex_hash;

            DagVertices::<T>::insert(vertex_hash, vertex_final);

            // Update DAG tips
            Self::update_dag_tips(vertex_hash, parent_refs);

            Self::deposit_event(Event::VertexAdded(vertex_hash));
            Ok(())
        }

        /// Confirm vertex (by grid nodes)
        /// Grid coordinators validate transactions for fast settlement
        #[pallet::weight(10_000)]
        #[pallet::call_index(1)]
        pub fn confirm_vertex(
            origin: OriginFor<T>,
            vertex_hash: T::Hash,
        ) -> DispatchResult {
            let confirmer = ensure_signed(origin)?;

            // Verify confirmer is a grid node
            ensure!(
                Self::grid_nodes(&confirmer).is_some(),
                Error::<T>::NotGridNode
            );

            let mut vertex = Self::dag_vertices(&vertex_hash)
                .ok_or(Error::<T>::VertexNotFound)?;

            ensure!(!vertex.finalized, Error::<T>::AlreadyFinalized);

            vertex.confirmation_count += 1;

            // Finalize after sufficient confirmations (e.g., 3 grid nodes)
            if vertex.confirmation_count >= 3 {
                vertex.finalized = true;
                FinalizedCount:<T>::mutate(|count| *count += 1);
Self::deposit_event(Event::VertexFinalized(vertex_hash));
}
DagVertices::<T>::insert(vertex_hash, vertex.clone());
        Self::deposit_event(Event::VertexConfirmed(vertex_hash, vertex.confirmation_count));

        Ok(())
    }

    /// Register as grid coordinator node
    /// Enables participation in DAG consensus for local grid coordination
    #[pallet::weight(10_000)]
    #[pallet::call_index(2)]
    pub fn register_grid_node(
        origin: OriginFor<T>,
        grid_zone: u32,
    ) -> DispatchResult {
        let node_id = ensure_signed(origin)?;

        let current_block = <frame_system::Pallet<T>>::block_number();

        let node = GridNode {
            node_id: node_id.clone(),
            grid_zone,
            is_active: true,
            last_heartbeat: current_block,
            vertices_confirmed: 0,
        };

        GridNodes::<T>::insert(&node_id, node);
        Self::deposit_event(Event::GridNodeRegistered(node_id, grid_zone));

        Ok(())
    }

    /// Send heartbeat signal
    /// Maintains node liveness for consensus participation
    #[pallet::weight(10_000)]
    #[pallet::call_index(3)]
    pub fn send_heartbeat(origin: OriginFor<T>) -> DispatchResult {
        let node_id = ensure_signed(origin)?;

        GridNodes::<T>::mutate(&node_id, |maybe_node| {
            if let Some(node) = maybe_node {
                let current_block = <frame_system::Pallet<T>>::block_number();
                node.last_heartbeat = current_block;
            }
        });

        Self::deposit_event(Event::NodeHeartbeat(node_id));
        Ok(())
    }
}

impl<T: Config> Pallet<T> {
    /// Update DAG tips after adding new vertex
    fn update_dag_tips(new_vertex: T::Hash, parents: BoundedVec<T::Hash, ConstU32<8>>) {
        DagTips::<T>::mutate(|tips| {
            // Remove parents from tips (they now have children)
            tips.retain(|tip| !parents.contains(tip));
            
            // Add new vertex as tip
            let _ = tips.try_push(new_vertex);
        });
    }

    /// Get current DAG tips for reference selection
    pub fn get_current_tips() -> Vec<T::Hash> {
        Self::dag_tips().into_inner()
    }

    /// Check if vertex is finalized
    pub fn is_vertex_finalized(vertex_hash: &T::Hash) -> bool {
        Self::dag_vertices(vertex_hash)
            .map(|v| v.finalized)
            .unwrap_or(false)
    }
}
}