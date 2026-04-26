//! Tiny JSONC parser. VS Code's `settings.json` allows `// line` and
//! `/* block */` comments and trailing commas; this module strips them
//! and forwards to `serde_json`. We keep our own small implementation
//! rather than pulling in `jsonc-parser` so the binary stays slim.

use serde::de::DeserializeOwned;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum JsoncParseError {
    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),
}

impl JsoncParseError {
    pub fn message(&self) -> String {
        self.to_string()
    }
}

pub fn parse_jsonc<T: DeserializeOwned>(input: &str) -> Result<T, JsoncParseError> {
    let stripped = strip_jsonc(input);
    if stripped.trim().is_empty() {
        return serde_json::from_str("null").map_err(JsoncParseError::Json);
    }
    serde_json::from_str(&stripped).map_err(JsoncParseError::Json)
}

/// Remove `//` and `/* */` comments and trailing commas while preserving
/// strings (including embedded escapes).
pub fn strip_jsonc(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out: Vec<u8> = Vec::with_capacity(bytes.len());
    let mut i = 0usize;
    let len = bytes.len();

    while i < len {
        let b = bytes[i];

        // string literal — copy verbatim, watching for backslash escapes
        if b == b'"' {
            out.push(b);
            i += 1;
            while i < len {
                let c = bytes[i];
                out.push(c);
                if c == b'\\' && i + 1 < len {
                    // copy the escape sequence as-is (two bytes for ASCII
                    // escapes; \uXXXX is fine because the escape byte
                    // itself is preserved and no JSONC syntax intervenes)
                    out.push(bytes[i + 1]);
                    i += 2;
                    continue;
                }
                i += 1;
                if c == b'"' {
                    break;
                }
            }
            continue;
        }

        // // line comment
        if b == b'/' && i + 1 < len && bytes[i + 1] == b'/' {
            i += 2;
            while i < len && bytes[i] != b'\n' {
                i += 1;
            }
            continue;
        }

        // /* block comment */
        if b == b'/' && i + 1 < len && bytes[i + 1] == b'*' {
            i += 2;
            while i + 1 < len && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                i += 1;
            }
            i = (i + 2).min(len);
            continue;
        }

        // trailing comma: a comma followed by whitespace and then ] or }
        if b == b',' {
            let mut j = i + 1;
            while j < len && (bytes[j] as char).is_ascii_whitespace() {
                j += 1;
            }
            if j < len && (bytes[j] == b']' || bytes[j] == b'}') {
                // skip the comma; copy the whitespace through
                i += 1;
                continue;
            }
        }

        out.push(b);
        i += 1;
    }

    // SAFETY: we only ever copy whole bytes from a valid UTF-8 input
    // (string literals are forwarded byte-for-byte; outside strings we
    // only touch ASCII), so the result remains valid UTF-8.
    String::from_utf8(out).expect("strip_jsonc preserves UTF-8")
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;

    fn parse(input: &str) -> Value {
        parse_jsonc::<Value>(input).unwrap()
    }

    #[test]
    fn parses_pure_json() {
        assert_eq!(parse(r#"{"a": 1}"#)["a"], 1);
    }

    #[test]
    fn strips_line_comments() {
        let v = parse(
            r#"
            // a comment
            { "x": 1 } // trailing
        "#,
        );
        assert_eq!(v["x"], 1);
    }

    #[test]
    fn strips_block_comments() {
        let v = parse(
            r#"
            /* block
               spans
               multiple lines */
            { "y": 2 }
        "#,
        );
        assert_eq!(v["y"], 2);
    }

    #[test]
    fn strips_trailing_commas_in_object() {
        let v = parse(r#"{ "x": 1, "y": 2, }"#);
        assert_eq!(v["y"], 2);
    }

    #[test]
    fn strips_trailing_commas_in_array() {
        let v = parse(r#"{ "xs": [1, 2, 3,] }"#);
        assert_eq!(v["xs"][2], 3);
    }

    #[test]
    fn does_not_strip_inside_strings() {
        let v = parse(r#"{ "x": "// not a comment, /* nor this */" }"#);
        assert_eq!(v["x"], "// not a comment, /* nor this */");
    }

    #[test]
    fn handles_escaped_quotes_in_strings() {
        let v = parse(r#"{ "x": "a\"b" }"#);
        assert_eq!(v["x"], "a\"b");
    }

    #[test]
    fn empty_document_parses_as_null() {
        let v: Value = parse_jsonc(" \n  \t\n").unwrap();
        assert!(v.is_null());
    }
}
