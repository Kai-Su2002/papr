//! HTML sanitization and text extraction. Every piece of feed- or web-supplied
//! HTML passes through `sanitize` before it is ever stored or rendered.

use ammonia::{Builder, UrlRelative};
use std::collections::HashSet;
use url::Url;

/// Sanitize untrusted HTML for safe rendering inside the reader webview.
/// Relative URLs are rewritten against `base` so feed images/links resolve.
pub fn sanitize(html: &str, base: Option<&str>) -> String {
    let mut builder = Builder::default();
    builder
        .link_rel(Some("noopener noreferrer nofollow"))
        .add_generic_attributes(["loading"]);

    let parsed_base = base.and_then(|b| Url::parse(b).ok());
    if let Some(b) = parsed_base {
        builder.url_relative(UrlRelative::RewriteWithBase(b));
    }
    builder.clean(html).to_string()
}

/// Strip all markup from HTML, yielding collapsed plain text. Used for the
/// FTS body index, list snippets, and AI prompt context.
pub fn html_to_text(html: &str) -> String {
    // Drop script/style content entirely, then strip the rest of the tags.
    let cleaned = Builder::new()
        .tags(HashSet::new())
        .clean(html)
        .to_string();
    cleaned.split_whitespace().collect::<Vec<_>>().join(" ")
}
