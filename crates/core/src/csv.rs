use std::time::Duration;

use serde::Deserialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum FetchError {
    #[error("HTTP fetch failed: {0}")]
    Http(String),
    #[error("CSV parse failed: {0}")]
    Csv(#[from] csv::Error),
}

#[derive(Debug, Clone)]
pub struct FetchOptions {
    pub timeout: Duration,
}

impl Default for FetchOptions {
    fn default() -> Self {
        Self {
            timeout: Duration::from_secs(5),
        }
    }
}

/// Trait so resolve() can take an in-memory mock during tests.
pub trait CsvFetcher: Send + Sync {
    fn fetch(&self, url: &str) -> Result<String, FetchError>;
}

/// Default fetcher: synchronous HTTP via ureq. Configured with a 5s
/// timeout to mirror `packages/core/src/csv.ts`'s axios default.
pub struct HttpCsvFetcher {
    options: FetchOptions,
}

impl HttpCsvFetcher {
    pub fn new() -> Self {
        Self { options: FetchOptions::default() }
    }

    pub fn with_options(options: FetchOptions) -> Self {
        Self { options }
    }
}

impl Default for HttpCsvFetcher {
    fn default() -> Self {
        Self::new()
    }
}

impl CsvFetcher for HttpCsvFetcher {
    fn fetch(&self, url: &str) -> Result<String, FetchError> {
        let agent = ureq::Agent::config_builder()
            .timeout_global(Some(self.options.timeout))
            .build()
            .new_agent();
        let mut response = agent
            .get(url)
            .call()
            .map_err(|e| FetchError::Http(e.to_string()))?;
        response
            .body_mut()
            .read_to_string()
            .map_err(|e| FetchError::Http(e.to_string()))
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct RemoteCsvRow {
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub project: String,
}

pub fn parse_csv(body: &str) -> Result<Vec<RemoteCsvRow>, FetchError> {
    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_reader(body.as_bytes());
    let mut out = Vec::new();
    for record in rdr.deserialize::<RemoteCsvRow>() {
        out.push(record?);
    }
    Ok(out)
}

/// Mock fetchers exposed to other test modules in this crate.
/// Marked `pub` (not `pub(crate)`) so re-exports from sibling test
/// modules compile, but the whole module is `cfg(test)` so it's
/// stripped from non-test builds and the public surface.
#[cfg(test)]
pub mod test_support {
    use super::*;

    pub struct StaticFetcher {
        pub body: String,
    }
    impl CsvFetcher for StaticFetcher {
        fn fetch(&self, _url: &str) -> Result<String, FetchError> {
            Ok(self.body.clone())
        }
    }

    pub struct FailingFetcher;
    impl CsvFetcher for FailingFetcher {
        fn fetch(&self, _url: &str) -> Result<String, FetchError> {
            Err(FetchError::Http("mocked network failure".into()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_csv_handles_headers_and_optional_columns() {
        let body = "url,title,description,project\nhttps://a/,Title A,Some,proj-x\nhttps://b/,Title B,,#shared-links\n";
        let rows = parse_csv(body).unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].url, "https://a/");
        assert_eq!(rows[0].project, "proj-x");
        assert_eq!(rows[1].project, "#shared-links");
        // csv crate maps an empty cell to None for Option<String>; the
        // TS papaparse port keeps "" instead. resolve() treats both the
        // same (no description), so we accept the Rust idiom here.
        assert!(rows[1].description.is_none());
    }

    #[test]
    fn parse_csv_tolerates_extra_columns() {
        let body = "url,title,description,project,extra\nhttps://x/,T,D,p,ignored\n";
        let rows = parse_csv(body).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].url, "https://x/");
    }

    #[test]
    fn http_fetcher_compiles_with_default_options() {
        let _ = HttpCsvFetcher::new();
    }
}
