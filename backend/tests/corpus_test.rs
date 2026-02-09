use language_networks_backend::corpus::{graph_builder, processor};

#[test]
fn end_to_end_corpus_processing() {
    let text = "Alice was beginning to get very tired of sitting by her sister on the bank";
    let words = processor::process_text(text);
    assert!(!words.is_empty());

    let graph = graph_builder::build_graph(&words);
    assert!(graph.nodes.len() > 1);
    assert!(!graph.links.is_empty());
    assert!(graph.meta.total_words > 0);
    assert!(graph.meta.max_position > 0);
}

#[test]
fn processor_filters_short_words() {
    let words = processor::process_text("I am a big cat");
    // "I", "a" are single-char, should be filtered
    assert!(!words.contains(&"i".to_string()));
    assert!(!words.contains(&"a".to_string()));
    assert!(words.contains(&"am".to_string()));
    assert!(words.contains(&"big".to_string()));
    assert!(words.contains(&"cat".to_string()));
}

#[test]
fn graph_builder_creates_root_node() {
    let words = vec!["hello".to_string()];
    let graph = graph_builder::build_graph(&words);

    let root = graph.nodes.iter().find(|n| n.id == "ROOT");
    assert!(root.is_some());
    assert_eq!(root.unwrap().character, "ROOT");
    assert_eq!(root.unwrap().position, 0);
}
