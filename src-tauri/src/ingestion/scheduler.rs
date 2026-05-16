//! Feed refresh: a reusable `refresh_all` (driven by both the manual command
//! and the periodic timer) plus the background scheduler loop.

use crate::db;
use crate::error::AppResult;
use crate::ingestion::{fetch, parse};
use crate::models::RefreshProgress;
use crate::state::AppState;
use std::time::Duration;
use tauri::{ipc::Channel, AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;
use tokio::task::JoinSet;

/// Outcome of fetching one feed.
enum Outcome {
    NotModified,
    Updated {
        parsed: parse::ParsedFeed,
        etag: Option<String>,
        last_modified: Option<String>,
    },
    Failed(String),
}

async fn fetch_one(
    client: &reqwest::Client,
    url: &str,
    etag: Option<String>,
    last_modified: Option<String>,
) -> Outcome {
    match fetch::conditional_get(client, url, etag.as_deref(), last_modified.as_deref()).await {
        Ok(fetch::Fetched::NotModified) => Outcome::NotModified,
        Ok(fetch::Fetched::Body {
            bytes,
            etag,
            last_modified,
        }) => match parse::parse_feed(&bytes, url) {
            Ok(parsed) => Outcome::Updated {
                parsed,
                etag,
                last_modified,
            },
            Err(e) => Outcome::Failed(e.to_string()),
        },
        Err(e) => Outcome::Failed(e.to_string()),
    }
}

/// Refresh every feed concurrently. Streams per-feed progress over `progress`
/// when provided, emits a `feeds-updated` event, and returns the new-article count.
pub async fn refresh_all(
    app: &AppHandle,
    progress: Option<Channel<RefreshProgress>>,
) -> AppResult<usize> {
    let state = app.state::<AppState>();

    let feeds = {
        let conn = state.db.lock().await;
        db::feeds_to_refresh(&conn)?
    };
    if let Some(p) = &progress {
        let _ = p.send(RefreshProgress::Started { total: feeds.len() });
    }

    let mut set: JoinSet<(i64, Outcome)> = JoinSet::new();
    for (id, url, etag, last_modified) in feeds {
        let client = state.http.clone();
        set.spawn(async move {
            (id, fetch_one(&client, &url, etag, last_modified).await)
        });
    }

    let mut total_new = 0usize;
    while let Some(joined) = set.join_next().await {
        let Ok((feed_id, outcome)) = joined else {
            continue;
        };
        let mut new_here = 0usize;
        let mut error: Option<String> = None;

        {
            let conn = state.db.lock().await;
            match outcome {
                Outcome::NotModified => {
                    let _ = db::touch_feed(&conn, feed_id);
                }
                Outcome::Failed(e) => {
                    let _ = db::set_feed_error(&conn, feed_id, &e);
                    error = Some(e);
                }
                Outcome::Updated {
                    parsed,
                    etag,
                    last_modified,
                } => {
                    for article in &parsed.articles {
                        if db::upsert_article(&conn, feed_id, article).unwrap_or(false) {
                            new_here += 1;
                        }
                    }
                    let _ = db::update_feed_meta(
                        &conn,
                        feed_id,
                        parsed.title.as_deref(),
                        parsed.site_url.as_deref(),
                        parsed.description.as_deref(),
                        parsed.icon.as_deref(),
                    );
                    let _ = db::set_feed_fetch_state(
                        &conn,
                        feed_id,
                        etag.as_deref(),
                        last_modified.as_deref(),
                        None,
                    );
                }
            }
        }

        total_new += new_here;
        if let Some(p) = &progress {
            let _ = p.send(RefreshProgress::FeedDone {
                feed_id,
                new_articles: new_here,
                error,
            });
        }
    }

    if let Some(p) = &progress {
        let _ = p.send(RefreshProgress::Finished {
            new_articles: total_new,
        });
    }
    let _ = app.emit("feeds-updated", total_new);

    if total_new > 0 {
        let _ = app
            .notification()
            .builder()
            .title("Lumen")
            .body(format!("{total_new} new article(s)"))
            .show();
    }
    Ok(total_new)
}

/// Read the refresh interval (minutes) from settings, defaulting to 30.
async fn refresh_interval_minutes(app: &AppHandle) -> u64 {
    let state = app.state::<AppState>();
    let conn = state.db.lock().await;
    db::get_setting(&conn, "refresh_interval_min")
        .ok()
        .flatten()
        .and_then(|v| v.parse().ok())
        .filter(|m| *m >= 5)
        .unwrap_or(30)
}

/// Spawn the background refresh loop. The app must stay resident (tray) for
/// this to run — macOS does not execute the process after the app is quit.
pub fn spawn_scheduler(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_secs(8)).await;
        loop {
            if let Err(e) = refresh_all(&app, None).await {
                log::warn!("scheduled refresh failed: {e}");
            }
            let mins = refresh_interval_minutes(&app).await;
            tokio::time::sleep(Duration::from_secs(mins * 60)).await;
        }
    });
}
