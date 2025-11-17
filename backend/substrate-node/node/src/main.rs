// backend/substrate-node/node/src/main.rs
// Substrate node entry point

mod chain_spec;
mod cli;
mod rpc;
mod service;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = cli::Cli::from_args();
    
    match cli.subcommand {
        Some(cli::Subcommand::BuildSpec(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.sync_run(|config| cmd.run(config.chain_spec, config.network))
        }
        Some(cli::Subcommand::ExportGenesisState(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.sync_run(|_config| {
                let spec = cli.load_spec(&cmd.shared_params.chain.clone().unwrap_or_default())?;
                cmd.run::<service::Block>(&*spec)
            })
        }
        Some(cli::Subcommand::ExportGenesisWasm(cmd)) => {
            let runner = cli.create_runner(&cmd)?;
            runner.sync_run(|_config| {
                let spec = cli.load_spec(&cmd.shared_params.chain.clone().unwrap_or_default())?;
                cmd.run(&*spec)
            })
        }
        None => {
            let runner = cli.create_runner(&cli.run)?;
            runner.run_node_until_exit(|config| async move {
                service::new_full(config).map_err(Into::into)
            })
        }
    }
}