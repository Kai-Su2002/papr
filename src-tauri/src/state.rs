//! Shared application state, registered via `Builder::manage` and injected into
//! commands as `tauri::State<AppState>`.

use reqwest::Client;
use rusqlite::Connection;
use tokio::sync::Mutex;

pub struct AppState {
    /// The single SQLite connection, guarded by an async mutex. All access is
    /// short and synchronous, so the lock is never held across `.await`.
    pub db: Mutex<Connection>,
    /// Shared HTTP client (connection pooling) for all feed fetching.
    pub http: Client,
}
