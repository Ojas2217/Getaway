mod lib;
use axum::{Router, routing::get,routing::put,routing::options, extract::State, response::Json};
use std::fs;
use std::fs::OpenOptions;
use std::sync::Arc;
use axum::response::IntoResponse;
use http::StatusCode;
use tokio::sync::RwLock;
use lib::*;
use url::Url;
use tower_http::cors::{Any, CorsLayer};
use http::header::{CONTENT_TYPE};
use http::Method;
use std::env;
use std::error::Error;
use std::fs::File;
use std::io::Write;
use std::process::exit;
use std::time::{SystemTime};
use chrono::Local;
use dotenvy::dotenv;
#[tokio::main]
pub async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    println!("{}",env::var("POLICY_ADDR").as_deref().unwrap_or("No POLICY_ADDR set"));
    let policy_addr = env::var("POLICY_ADDR").unwrap_or("127.0.0.1:3000".to_string());
    
    let router = Router::new();
    let data = fs::read_to_string("./policies.json")?;
    let policies: Policies =serde_json::from_str(&data)?;
    let state = Arc::new(RwLock::new(policies));
    let cors = CorsLayer::new()
   .allow_methods([Method::GET, Method::PUT])
   .allow_origin(Any)
   .allow_headers([CONTENT_TYPE]);
    let app = router
        .route("/policies",get(get_policies))
        .route("/policies",put(put_policies))
        .route("/logs",get(get_logs))
        .with_state(state)
        .layer(cors);
    let listener = tokio::net::TcpListener::bind(&policy_addr).await.expect("Invalid policy address");
    axum::serve(listener, app).await.unwrap();
    Ok(())
}
async fn get_policies(state: State<Arc<RwLock<Policies>>>)->Json<Policies>{
    let policies = state.read().await.clone();
    Json(policies)
}
async fn get_logs()->impl IntoResponse{
    let data = fs::read_to_string("./logs.txt").unwrap_or("No logs found".to_string());
    (StatusCode::OK,Json(serde_json::json!({"logs":data})))
}

async fn put_policies(
    state: State<Arc<RwLock<Policies>>>,
    Json(new_policies): Json<Policies>
)-> impl IntoResponse {
    let old_policies = state.read().await.clone();
    let mut policies = state.write().await;
    

    if Url::parse(new_policies.backend.as_str()).is_err() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": "Invalid backend URL",
            "old":old_policies
        })));
    }
    if let Err(_) = fs::write("./policies.json",serde_json::to_string(&new_policies).unwrap()) {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":"Error Writing Policies"})))
    }
    *policies = new_policies.clone();
    log(old_policies,new_policies.clone());
    (StatusCode::OK, Json(serde_json::to_value(new_policies).unwrap()))
}
fn log(old: Policies,new: Policies){
    let mut logfile = OpenOptions::new().read(true).append(true).create(true).open("./logs.txt").expect("Unable to open log file");
    let mut result = String::new();
    if old.backend!=new.backend{result.push_str(format!("Policies @ [{}]: backend changed {} ->{}\n",Local::now().format("%Y-%m-%d %H:%M:%S"),old.backend,new.backend).as_str());};
    if old.cache_duration!=new.cache_duration { result.push_str(format!("Policies @ [{}]: cache duration changed {} -> {}\n",Local::now().format("%Y-%m-%d %H:%M:%S"),old.cache_duration,new.cache_duration).as_str()); }
    if old.path_prefix != new.path_prefix {result.push_str(format!("Policies @ [{}]: path prefix changed {} -> {}\n",Local::now().format("%Y-%m-%d %H:%M:%S"),old.path_prefix,new.path_prefix).as_str());}
    if old.request_timeout != new.request_timeout{result.push_str(format!("Policies @ [{}]: timeout seconds changed {} -> {}\n",Local::now().format("%Y-%m-%d %H:%M:%S"),old.request_timeout,new.request_timeout).as_str()); }
    if old.rate_limit.rate_limit_window != new.rate_limit.rate_limit_window{ result.push_str(format!("Policies @ [{}]: rate limit window size changed {} -> {}\n",Local::now().format("%Y-%m-%d %H:%M:%S"),old.rate_limit.rate_limit_window,new.rate_limit.rate_limit_window).as_str()); }
    if old.rate_limit.rate_limit_requests != new.rate_limit.rate_limit_requests{ result.push_str(format!("Policies @ [{}]: rate limit request changed {} -> {}\n",Local::now().format("%Y-%m-%d %H:%M:%S"),old.rate_limit.rate_limit_requests,new.rate_limit.rate_limit_requests).as_str()); }
    if old.authorization!=new.authorization{ result.push_str(format!("Policies @ [{}]: authorization tokens changed {:?} -> {:?}\n",Local::now().format("%Y-%m-%d %H:%M:%S"),old.authorization,new.authorization).as_str()); }
    if result.is_empty(){
        writeln!(&mut logfile,"{}", format!("Policies @ [{}]: No changes made to policies!\n",Local::now().format("%Y-%m-%d %H:%M:%S"))).expect("Unable to write to log file");
    } else{
        writeln!(&mut logfile,"{}", result.as_str()).expect("Unable to write to log file");

    }

}
