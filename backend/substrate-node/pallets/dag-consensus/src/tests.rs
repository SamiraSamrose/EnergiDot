// backend/substrate-node/pallets/dag-consensus/src/tests.rs
// Unit tests for DAG consensus

use crate::{mock::*, Error, TransactionType};
use frame_support::{assert_noop, assert_ok};
use sp_core::H256;

#[test]
fn register_grid_node_works() {
    new_test_ext().execute_with(|| {
        assert_ok!(DagConsensus::register_grid_node(
            RuntimeOrigin::signed(1),
            1
        ));

        let node = DagConsensus::grid_nodes(1).unwrap();
        assert_eq!(node.grid_zone, 1);
        assert!(node.is_active);
    });
}

#[test]
fn add_vertex_works() {
    new_test_ext().execute_with(|| {
        // Register grid node first
        assert_ok!(DagConsensus::register_grid_node(
            RuntimeOrigin::signed(1),
            1
        ));

        // Add genesis vertex
        assert_ok!(DagConsensus::add_vertex(
            RuntimeOrigin::signed(1),
            vec![],
            TransactionType::EnergyTransfer
        ));

        let tips = DagConsensus::dag_tips();
        assert_eq!(tips.len(), 1);
    });
}

#[test]
fn confirm_vertex_requires_grid_node() {
    new_test_ext().execute_with(|| {
        let vertex_hash = H256::zero();
        
        assert_noop!(
            DagConsensus::confirm_vertex(
                RuntimeOrigin::signed(1),
                vertex_hash
            ),
            Error::<Test>::NotGridNode
        );
    });
}

#[test]
fn vertex_finalization_works() {
    new_test_ext().execute_with(|| {
        // Register 3 grid nodes
        for i in 1..=3 {
            assert_ok!(DagConsensus::register_grid_node(
                RuntimeOrigin::signed(i),
                1
            ));
        }

        // Add vertex
        assert_ok!(DagConsensus::add_vertex(
            RuntimeOrigin::signed(1),
            vec![],
            TransactionType::EnergyTransfer
        ));

        let vertices: Vec<_> = DagVertices::<Test>::iter().collect();
        let (vertex_hash, _) = vertices[0].clone();

        // Confirm by 3 nodes
        for i in 1..=3 {
            assert_ok!(DagConsensus::confirm_vertex(
                RuntimeOrigin::signed(i),
                vertex_hash
            ));
        }

        // Check finalized
        let vertex = DagConsensus::dag_vertices(vertex_hash).unwrap();
        assert!(vertex.finalized);
    });
}