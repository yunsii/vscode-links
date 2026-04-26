//! N-API binding for `vscode-links-core`. The strict thin-wrapper rule
//! from the TS CLI applies here too: this file does no business logic;
//! every fn just deserialises a JSON payload, calls into core, and
//! returns the JSON-shaped result. Both the .node addon (consumed by
//! the VSIX) and the standalone bin therefore exercise the exact same
//! Rust code path.

#![deny(clippy::all)]

use napi::Error;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use vscode_links_core::{
    EditorContext, LinksConfig, ResolveOptions, render_template as core_render_template,
    resolve as core_resolve,
};

/// `resolve(opts)` — opts is whatever JS gives us; we deserialise it
/// into core's `ResolveOptions` and serialise the result back as a
/// plain JSON value.
///
/// The signature deliberately accepts a `serde_json::Value` so the
/// JS-side `LinksConfig` shape can evolve in lockstep with the TS
/// implementation without regenerating bindings.
#[napi(js_name = "resolveSync")]
pub fn resolve_sync(opts: serde_json::Value) -> Result<serde_json::Value> {
    let cwd = opts
        .get("cwd")
        .and_then(|v| v.as_str())
        .ok_or_else(|| Error::from_reason("opts.cwd is required"))?
        .to_string();

    let config: LinksConfig = match opts.get("config") {
        Some(v) if !v.is_null() => serde_json::from_value(v.clone())
            .map_err(|e| Error::from_reason(format!("invalid opts.config: {e}")))?,
        _ => LinksConfig::default(),
    };

    let editor_context = match opts.get("editorContext") {
        Some(v) if !v.is_null() => Some(
            serde_json::from_value::<EditorContext>(v.clone())
                .map_err(|e| Error::from_reason(format!("invalid opts.editorContext: {e}")))?,
        ),
        _ => None,
    };

    let fail_soft = opts
        .get("failSoft")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);

    let mut options = ResolveOptions::new(cwd);
    options.config = config;
    options.editor_context = editor_context;
    options.fail_soft = fail_soft;

    let result = core_resolve(options).map_err(|e| Error::from_reason(e.to_string()))?;
    serde_json::to_value(result).map_err(|e| Error::from_reason(e.to_string()))
}

/// `renderTemplate(template, context)` — exposes the strict whitelist
/// renderer for callers (including future picker UIs) that want to
/// re-render a row at click time against a fresh context.
#[napi(js_name = "renderTemplateSync")]
pub fn render_template_sync(template: String, context: serde_json::Value) -> Result<String> {
    core_render_template(&template, &context).map_err(|e| {
        Error::from_reason(format!(
            "{} (reason={:?}, variable={})",
            e.message, e.reason, e.variable
        ))
    })
}
