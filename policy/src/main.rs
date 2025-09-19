mod lib;

use axum::{Router, routing::get,routing::put, extract::State, response::Json};
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Arc;
use tokio::sync::RwLock;
use lib::*;

#[tokio::main]
pub async fn main() {
    let router = Router::new();
    let data = fs::read_to_string("./policies.json").expect("Unable to read policies.json");
    let policies: Policies = serde_json::from_str(&data).expect("JSON was not well-formatted");
    let state = Arc::new(RwLock::new(policies));

    let app = router
        .route("/policies",get(get_policies))
        .route("/policies",put(put_policies))
        .with_state(state);


    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
async fn get_policies(state: State<Arc<RwLock<Policies>>>)->Json<Policies>{
    let policies = state.read().await.clone();
    Json(policies)
}

async fn put_policies(
    state: State<Arc<RwLock<Policies>>>,
    Json(new_policies): Json<Policies>
){
    let mut policies = state.write().await;
    *policies = new_policies.clone();
    fs::write("./policies.json",serde_json::to_string_pretty(&*policies).unwrap())
        .expect("Unable to write to policies.json");
}


