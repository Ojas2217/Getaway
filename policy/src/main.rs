mod lib;
use axum::{Router, routing::get,routing::put, extract::State, response::Json};
use serde::{Deserialize, Serialize};
use std::fs;
use std::ops::Add;
use std::sync::Arc;
use axum::response::IntoResponse;
use http::StatusCode;
use tokio::sync::RwLock;
use lib::*;
use url::{Url, ParseError};

#[tokio::main]
pub async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let router = Router::new();
    let data = fs::read_to_string("./policies.json")?;
    let policies: Policies =serde_json::from_str(&data)?;
    let state = Arc::new(RwLock::new(policies));

    let app = router
        .route("/policies",get(get_policies))
        .route("/policies",put(put_policies))
        .with_state(state);
    //todo add request validation for get and put.
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
    Ok(())
}
async fn get_policies(state: State<Arc<RwLock<Policies>>>)->Json<Policies>{
    let policies = state.read().await.clone();
    Json(policies)
}

async fn put_policies(
    state: State<Arc<RwLock<Policies>>>,
    Json(new_policies): Json<Policies>
)-> impl IntoResponse {
    let old_policies = state.read().await.clone();
    let mut policies = state.write().await;
    *policies = new_policies.clone();

    if Url::parse(policies.backend.as_str()).is_err() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": "Invalid backend URL"
        })));
    }
    if let Err(_) = fs::write("./policies.json",serde_json::to_string(&*policies).unwrap()) {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":"Error Writing Policies"})))
    }
    log(old_policies,new_policies.clone());
    (StatusCode::OK, Json(serde_json::to_value(new_policies).unwrap()))
}
fn log(old: Policies,new: Policies){
    let mut result = String::new();
    if old.backend!=new.backend{result.push_str(format!("backend changed {} ->{}\n",old.backend,new.backend).as_str());};
    if old.cache_duration!=new.cache_duration { result.push_str(format!("cache duration changed {} -> {}\n",old.cache_duration,new.cache_duration).as_str()); }
    if old.path_prefix != new.path_prefix {result.push_str(format!("path prefix changed {} -> {}\n",old.path_prefix,new.path_prefix).as_str());}
    if old.request_timeout != new.request_timeout{result.push_str(format!("timeout seconds changed {} -> {}\n",old.request_timeout,new.request_timeout).as_str()); }
    if old.rate_limit.rate_limit_window != new.rate_limit.rate_limit_window{ result.push_str(format!("rate limit window size changed {} -> {}\n",old.rate_limit.rate_limit_window,new.rate_limit.rate_limit_window).as_str()); }
    if old.rate_limit.rate_limit_requests != new.rate_limit.rate_limit_requests{ result.push_str(format!("rate limit request changed {} -> {}\n",old.rate_limit.rate_limit_requests,new.rate_limit.rate_limit_requests).as_str()); }
    if old.authorization!=new.authorization{ result.push_str(format!("authorization tokens changed {:?} -> {:?}\n",old.authorization,new.authorization).as_str()); }
    if result.is_empty(){
        println!("No changes made to policies!")
    } else{
        println!("{}",result);
    }

}
