mod api;
mod corpus;

use axum::{routing::get, routing::post, Router};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .route("/api/process-corpus", post(api::handlers::process_corpus))
        .route("/api/samples/{name}", get(api::handlers::get_sample));

    let app = api_routes
        .fallback_service(ServeDir::new("../dist"))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server listening on http://{addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
