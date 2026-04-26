use std::fmt::Write;

use serde::Serialize;
use vscode_links_core::ResolveResult;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputFormat {
    Json,
    Ndjson,
    Tsv,
}

impl std::str::FromStr for OutputFormat {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "json" => Ok(Self::Json),
            "ndjson" => Ok(Self::Ndjson),
            "tsv" => Ok(Self::Tsv),
            other => Err(format!("--format must be one of json|ndjson|tsv, got {other}")),
        }
    }
}

pub fn format_result(result: &ResolveResult, mode: OutputFormat) -> String {
    match mode {
        OutputFormat::Json => format!(
            "{}\n",
            serde_json::to_string_pretty(result).expect("serde infallible for ResolveResult")
        ),
        OutputFormat::Ndjson => format_ndjson(result),
        OutputFormat::Tsv => format_tsv(result),
    }
}

#[derive(Serialize)]
struct NdjsonEnvelope<'a, T: Serialize> {
    kind: &'static str,
    data: &'a T,
}

#[derive(Serialize)]
struct NdjsonContext<'a> {
    kind: &'static str,
    #[serde(flatten)]
    data: &'a serde_json::Value,
}

fn format_ndjson(result: &ResolveResult) -> String {
    let mut out = String::new();
    // context goes first; JS side uses { kind: "context", data: ... } too.
    let ctx = NdjsonEnvelope { kind: "context", data: &result.context };
    writeln!(out, "{}", serde_json::to_string(&ctx).unwrap()).unwrap();
    for link in &result.links {
        let envelope = NdjsonEnvelope { kind: "link", data: link };
        writeln!(out, "{}", serde_json::to_string(&envelope).unwrap()).unwrap();
    }
    for skipped in &result.skipped {
        let envelope = NdjsonEnvelope { kind: "skipped", data: skipped };
        writeln!(out, "{}", serde_json::to_string(&envelope).unwrap()).unwrap();
    }
    for diag in &result.diagnostics {
        let envelope = NdjsonEnvelope { kind: "diagnostic", data: diag };
        writeln!(out, "{}", serde_json::to_string(&envelope).unwrap()).unwrap();
    }
    let _ = NdjsonContext { kind: "context", data: &result.context }; // keep helper compiling
    out
}

fn format_tsv(result: &ResolveResult) -> String {
    let mut out = String::new();
    for link in &result.links {
        let type_str = serde_json::to_string(&link.r#type).unwrap();
        let type_unquoted = type_str.trim_matches('"');
        writeln!(
            out,
            "{}\t{}\t{}\t{}",
            escape_tsv(type_unquoted),
            escape_tsv(&link.source),
            escape_tsv(&link.url),
            escape_tsv(&link.title),
        )
        .unwrap();
    }
    out
}

fn escape_tsv(s: &str) -> String {
    s.replace('\t', " ").replace(['\n', '\r'], " ")
}
