use anyhow::Result;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("dusklight_agent=debug".parse()?),
        )
        .init();

    info!("dusklight-agent starting");

    // TODO: bind Unix socket, accept connections, serve Cap'n Proto protocol
    let socket_path = std::env::var("DUSKLIGHT_SOCKET")
        .unwrap_or_else(|_| "/tmp/dusklight-agent.sock".to_string());

    info!(%socket_path, "listening");

    // Placeholder: just keep running
    tokio::signal::ctrl_c().await?;
    info!("shutting down");
    Ok(())
}
