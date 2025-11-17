// backend/substrate-node/node/src/cli.rs
// Command line interface

use structopt::StructOpt;

#[derive(Debug, StructOpt)]
pub struct Cli {
    #[structopt(subcommand)]
    pub subcommand: Option<Subcommand>,

    #[structopt(flatten)]
    pub run: sc_cli::RunCmd,
}

#[derive(Debug, StructOpt)]
pub enum Subcommand {
    BuildSpec(sc_cli::BuildSpecCmd),
    ExportGenesisState(cumulus_client_cli::ExportGenesisStateCommand),
    ExportGenesisWasm(cumulus_client_cli::ExportGenesisWasmCommand),
}