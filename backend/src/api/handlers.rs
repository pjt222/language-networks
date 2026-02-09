use axum::{
    Json,
    extract::Path,
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;

use crate::corpus::{graph_builder, processor};

#[derive(Deserialize)]
pub struct ProcessCorpusRequest {
    text: String,
}

/// POST /api/process-corpus
/// Accepts raw text, tokenizes it, builds a positional character trie graph.
pub async fn process_corpus(
    Json(payload): Json<ProcessCorpusRequest>,
) -> impl IntoResponse {
    let words = processor::process_text(&payload.text);
    let graph = graph_builder::build_graph(&words);
    Json(graph)
}

/// GET /api/samples/:name
/// Returns a pre-built graph for a named sample corpus.
/// Currently returns a placeholder; real implementation will load from embedded data.
pub async fn get_sample(
    Path(name): Path<String>,
) -> impl IntoResponse {
    // TODO: Load actual sample corpora from embedded resources
    let sample_text = match name.as_str() {
        "english-common" => "the be to of and a in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us",
        _ => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": format!("Sample '{}' not found", name) })),
            )
                .into_response();
        }
    };

    let words = processor::process_text(sample_text);
    let graph = graph_builder::build_graph(&words);
    Json(graph).into_response()
}
