//! Public surface of `vscode-links-core` (Rust). Mirrors
//! `@vscode-links/core` (TS) so a Node consumer wired through napi-rs
//! and a shell consumer wired through the standalone bin produce the
//! same output for the same input.
//!
//! This first cut covers the pure layers — schemas, providers, and the
//! whitelist template engine. Git, CSV, JSONC config, and the
//! `resolve()` orchestrator land in subsequent commits.

pub mod providers;
pub mod schemas;
pub mod template;

pub use schemas::{BaseLinkResource, LinkResourceType, RemoteLinkResource};
pub use template::{
    AllowedTemplateVariable, TemplateRenderError, TemplateRenderErrorReason,
    ALLOWED_TEMPLATE_VARIABLES, render_template,
};
