mod config;
mod services;
mod structs;

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
use hyper_util::rt::TokioIo;
use tokio::net::TcpListener;
use hyper_util::rt::TokioExecutor;
use policy::{Policies,Authorization,RateLimit};
use http_body_util::Empty;
use tokio::net::TcpStream;
use tokio::sync::RwLock;
use crate::services::{authenticate, cache, get_cache, rate_limit_exceeded};
use crate::structs::App;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = TcpListener::bind(addr).await?;
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
    let policies_string = fs::read_to_string("./././policy/src/policies.json").expect("Unable to read policies.json");
    let policies: Policies = serde_json::from_str(&policies_string).expect("Unable to parse string");
    //auth
    if !authenticate(req.headers(),policies.clone()){
        let error = json!({
            "error":"unauthorized"
        }).to_string();
        let res = Response::builder().
            status(StatusCode::UNAUTHORIZED).
            header(CONTENT_TYPE,"application/json").
            body::<Full<Bytes>>(Full::from(Bytes::from(error))).unwrap();
        return Ok(res);
    }

    //rate limiting
    if rate_limit_exceeded(req.headers(),&state,policies.clone()).await{
        let error = json!({
            "error":"rate limit exceeded, try again later"
        }).to_string();
        let res = Response::builder().
            status(StatusCode::TOO_MANY_REQUESTS).
            header(CONTENT_TYPE,"application/json").
            body::<Full<Bytes>>(Full::from(Bytes::from(error))).unwrap();
        return Ok(res);
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


    let backend_res = match timeout(Duration::from_secs(policies.request_timeout), client.request(forward_req)).await{
        Ok(Ok(res)) => res,
        Ok(Err(e))=>{
            let error = json!({
            "error":format!("backend error : {}",e).to_string(),
        }).to_string();
            let res = Response::builder().
                status(StatusCode::BAD_GATEWAY).
                header(CONTENT_TYPE,"application/json").
                body::<Full<Bytes>>(Full::from(Bytes::from(error))).unwrap();
            return Ok(res);
        }
        Err(_) =>{
            let error = json!({
            "error":"request timed out"
        }).to_string();
            let res = Response::builder().
                status(StatusCode::GATEWAY_TIMEOUT).
                header(CONTENT_TYPE,"application/json").
                body::<Full<Bytes>>(Full::from(Bytes::from(error))).unwrap();
            return Ok(res);
        }
    };
    let status = backend_res.status();
    let headers = backend_res.headers();

    let mut response = Response::builder().status(status);
    for (key, value) in headers.iter() {
        response = response.header(key, value);
    }

    let collected_res = backend_res.into_body().collect().await.unwrap();
    let res_body_bytes = collected_res.to_bytes();

    let res = response.body(Full::from(res_body_bytes.clone())).unwrap();

    if method == Method::GET{
        cache(state,uri.to_string(),(res.status(), res_body_bytes),policies.clone()).await;
    }

    println!(
        "{} {} {} {}ms",
        method,
        uri,
        res.status(),
        SystemTime::now().duration_since(start).unwrap().as_millis()

    );

    Ok(res)
}