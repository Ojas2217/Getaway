mod config;
mod services;
mod structs;
mod error_handler;

use std::env;
use std::fs::File;
use std::io::Write;
use std::process::exit;
use chrono::Local;
use std::collections::HashMap;
use serde_json::json;
use std::convert::Infallible;
use std::error::Error;
use std::io::Read;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use http::header::CONTENT_TYPE;
use http::StatusCode;
use hyper_util::client::legacy::Client;
use http_body_util::Full;
use hyper::body::{Body, Bytes, Incoming,Buf};
use std::fs;
use http_body_util::Collected;
use tokio::time::timeout;
use http_body_util::BodyExt;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response,Method};
use hyper::header::{HeaderName, HeaderValue, HeaderMap};
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;
use hyper_util::rt::TokioExecutor;
use policy::{Policies,RateLimit};
use http_body_util::Empty;
use tokio::net::TcpStream;
use tokio::sync::RwLock;
use crate::services::{authenticate, cache, get_cache, rate_limit_exceeded};
use crate::structs::App;
use error_handler::*;
use dotenvy::dotenv;
use crate::fs::OpenOptions;
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    dotenv().ok();
    let gateway_addr = env::var("GATEWAY_ADDR").unwrap_or("127.0.0.1:8080".to_string());

    let listener = TcpListener::bind(&gateway_addr).await.expect("Invalid gateway address");
    let state = Arc::new(RwLock::new(App {
        rates: HashMap::new(),cache: HashMap::new()
    }));
    loop {
        let (stream, _) = listener.accept().await?;
        let io = TokioIo::new(stream);
        let state = state.clone();
        tokio::task::spawn(async move {
            if let Err(err) = http1::Builder::new()
                .serve_connection(io, service_fn(move |req| {
                    gateway_handler(req,state.clone())
                }))
                .await
            {
                eprintln!("Error serving connection: {:?}", err);
            }
        });
    }
}

async fn gateway_handler(
    req: Request<Incoming>,
    state : Arc<RwLock<App>>
) -> Result<Response<Full<Bytes>>, Infallible> {
    let client = Client::builder(TokioExecutor::new()).build_http();
    let start = SystemTime::now();
    let policies_string = match fs::read_to_string("././policy/policies.json") {
        Ok(s) => s,
        Err(_) =>  return error(StatusCode::INTERNAL_SERVER_ERROR, "Error reading policies".to_string())
    };
    let policies: Policies = match serde_json::from_str(&policies_string) {
        Ok(p) => p,
        Err(_) => return error(StatusCode::INTERNAL_SERVER_ERROR,"Error parsing JSON".to_string())
    };

    //auth
    if !authenticate(req.headers(),policies.clone()){
        return error(StatusCode::UNAUTHORIZED, "Unauthorized".to_string());
    }

    //rate limiting
    if rate_limit_exceeded(req.headers(),&state,policies.clone()).await{
        return error(StatusCode::TOO_MANY_REQUESTS,"Rate limit exceeded, try again later".to_string());
    }

    //routing
    let mut route = req.uri().path();
    if route.starts_with(policies.path_prefix.as_str()){
        route = route.strip_prefix(policies.path_prefix.as_str()).unwrap()
    }
    let mut uri = format!("{}{}", policies.backend,route);
    if let Some(q) =  req.uri().query(){
        if !q.is_empty() {
            uri.push('?');
            uri.push_str(req.uri().query().unwrap());
        }
    }

    // retrieving cached res
    if req.method() == Method::GET{
        let key = format!("{}", uri);
        if let Some(res) = get_cache(state.clone(),key,policies.clone()).await{
            return Ok(res)
        }

    }

    let method = req.method().clone();
    let (parts, body) = req.into_parts();
    let collected = body.collect().await.unwrap();
    let body_bytes = collected.to_bytes();

    let forward_req: Request<Full<Bytes>> = Request::builder()
        .method(parts.method)
        .uri(uri.clone())
        .version(parts.version)
        .body(Full::from(body_bytes)).unwrap();


    let mut backend_res = match timeout(Duration::from_secs(policies.request_timeout), client.request(forward_req)).await{
        Ok(Ok(res)) => res,
        Ok(Err(e))=>{
            return error(StatusCode::BAD_GATEWAY,format!("backend error: {}",e).to_string());
        }
        Err(_) =>{
            return error(StatusCode::GATEWAY_TIMEOUT,"request timed out".to_string());
        }
    };
    let status = backend_res.status();
    let mut headers=backend_res.headers_mut();

    let mut response = Response::builder().status(status);

    headers.insert(
        HeaderName::from_static("access-control-allow-origin"),
        HeaderValue::from_static("*"),
    );
    headers.insert(
        HeaderName::from_static("access-control-allow-methods"),
        HeaderValue::from_static("GET, POST, PUT, DELETE, PATCH, OPTIONS"),
    );
    headers.insert(
        HeaderName::from_static("access-control-allow-headers"),
        HeaderValue::from_static("Content-Type, Authorization"),
    );
    for (key, value) in headers.clone().iter() {
        response = response.header(key, value);
    }
    let collected_res = backend_res.into_body().collect().await.unwrap();
    let res_body_bytes = collected_res.to_bytes();

    let res = response.body(Full::from(res_body_bytes.clone())).unwrap();

    if method == Method::GET{
        cache(state,uri.to_string(),(res.status(), res_body_bytes),policies.clone()).await;
    }
    let mut logfile = OpenOptions::new().read(true).append(true).create(true).open("././policy/logs.txt").expect("Unable to open log file");
    let toLog = format!(
        "Gateway @ [{}]: {} {} {} {}ms",
        Local::now().format("%Y-%m-%d %H:%M:%S"),
        method,
        uri,
        res.status(),
        SystemTime::now().duration_since(start).unwrap().as_millis()

    );
    writeln!(&mut logfile,"{}", toLog.as_str()).expect("Unable to write to log file");
    Ok(res)
}