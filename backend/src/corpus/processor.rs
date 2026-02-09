/// Extract words from raw text input.
/// Mirrors the JS processor.js logic: lowercase, split on non-alpha, filter short words.
pub fn process_text(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !c.is_alphabetic())
        .filter(|w| w.len() >= 2)
        .map(|w| w.to_string())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_words_from_text() {
        let words = process_text("Hello, World! This is a test.");
        assert!(words.contains(&"hello".to_string()));
        assert!(words.contains(&"world".to_string()));
        assert!(words.contains(&"this".to_string()));
        assert!(words.contains(&"test".to_string()));
        // Single-character words filtered out
        assert!(!words.contains(&"a".to_string()));
    }

    #[test]
    fn handles_empty_input() {
        let words = process_text("");
        assert!(words.is_empty());
    }
}
