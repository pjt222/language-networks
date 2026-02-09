use serde::Serialize;
use std::collections::HashMap;

pub const ROOT_ID: &str = "ROOT";

#[derive(Debug, Serialize, Clone)]
pub struct GraphNode {
    pub id: String,
    pub character: String,
    pub position: usize,
    pub frequency: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct GraphLink {
    pub source: String,
    pub target: String,
    pub weight: usize,
}

#[derive(Debug, Serialize)]
pub struct GraphMeta {
    #[serde(rename = "totalWords")]
    pub total_words: usize,
    #[serde(rename = "uniqueCharacters")]
    pub unique_characters: usize,
    #[serde(rename = "maxPosition")]
    pub max_position: usize,
    #[serde(rename = "uniqueTransitions")]
    pub unique_transitions: usize,
}

#[derive(Debug, Serialize)]
pub struct GraphData {
    pub nodes: Vec<GraphNode>,
    pub links: Vec<GraphLink>,
    pub meta: GraphMeta,
}

/// Build a positional character trie graph from a list of words.
/// Mirrors the JS graphBuilder.js logic.
pub fn build_graph(words: &[String]) -> GraphData {
    let mut node_freq: HashMap<String, usize> = HashMap::new();
    let mut edge_freq: HashMap<(String, String), usize> = HashMap::new();
    let mut node_char: HashMap<String, String> = HashMap::new();
    let mut node_pos: HashMap<String, usize> = HashMap::new();
    let mut max_position: usize = 0;

    // ROOT node
    node_freq.insert(ROOT_ID.to_string(), words.len());
    node_char.insert(ROOT_ID.to_string(), "ROOT".to_string());
    node_pos.insert(ROOT_ID.to_string(), 0);

    for word in words {
        let chars: Vec<char> = word.chars().collect();
        let mut previous_id = ROOT_ID.to_string();

        for (i, &ch) in chars.iter().enumerate() {
            let position = i + 1;
            let node_id = format!("{}-{}", ch, position);

            *node_freq.entry(node_id.clone()).or_insert(0) += 1;
            node_char.entry(node_id.clone()).or_insert_with(|| ch.to_string());
            node_pos.entry(node_id.clone()).or_insert(position);

            let edge_key = (previous_id.clone(), node_id.clone());
            *edge_freq.entry(edge_key).or_insert(0) += 1;

            if position > max_position {
                max_position = position;
            }

            previous_id = node_id;
        }
    }

    let unique_chars: std::collections::HashSet<&String> = node_char.values().collect();

    let nodes: Vec<GraphNode> = node_freq
        .iter()
        .map(|(id, &freq)| GraphNode {
            id: id.clone(),
            character: node_char.get(id).cloned().unwrap_or_default(),
            position: node_pos.get(id).copied().unwrap_or(0),
            frequency: freq,
        })
        .collect();

    let links: Vec<GraphLink> = edge_freq
        .iter()
        .map(|((source, target), &weight)| GraphLink {
            source: source.clone(),
            target: target.clone(),
            weight,
        })
        .collect();

    let meta = GraphMeta {
        total_words: words.len(),
        unique_characters: unique_chars.len().saturating_sub(1), // exclude ROOT
        max_position,
        unique_transitions: links.len(),
    };

    GraphData { nodes, links, meta }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_graph_from_words() {
        let words = vec!["cat".to_string(), "car".to_string()];
        let graph = build_graph(&words);

        assert!(graph.nodes.len() > 0);
        assert!(graph.links.len() > 0);
        assert_eq!(graph.meta.total_words, 2);
        assert_eq!(graph.meta.max_position, 3);
    }

    #[test]
    fn handles_empty_words() {
        let graph = build_graph(&[]);
        // Should have ROOT node
        assert_eq!(graph.nodes.len(), 1);
        assert_eq!(graph.links.len(), 0);
    }
}
