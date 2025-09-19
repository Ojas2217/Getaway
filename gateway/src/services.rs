use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::{Duration, SystemTime, SystemTimeError};
use bytes::Bytes;
use http::{HeaderMap, Response, StatusCode};
use http::header::CONTENT_TYPE;
use http_body_util::Full;
use policy::Policies;
use crate::config;
use crate::structs::{App, Cached_Entry, RateLimit};

pub fn authenticate(headers: &HeaderMap,policies: Policies ) -> bool{
    let auth = policies.authorization.tokens;
    if let Some(auth_header) = headers.get("Authorization"){
        if let Ok(header_str) = auth_header.to_str(){
            if header_str.starts_with("Bearer "){
                return auth.contains(&header_str[7..].to_string());
            }
        }
    }
    false
}
pub async fn rate_limit_exceeded(headers: &HeaderMap, state: &Arc<RwLock<App>>,policies: Policies) -> bool{
    let time = SystemTime::now();
    let window = policies.rate_limit.rate_limit_window;
    let rate = policies.rate_limit.rate_limit_requests;
    let ip = headers.get("x-forwarded-for").and_then(|h|h.to_str().ok()).unwrap_or("unknown");
    let mut state = state.write().await;
    if state.rates.contains_key(ip) && time.duration_since(state.rates.get(ip).unwrap().time).unwrap().as_secs() < window{
        state.rates.get_mut(ip).unwrap().rate+=1;
    }else{
        state.rates.insert(ip.to_string(), RateLimit{rate: 1,time});
    }
    state.rates.get(ip).unwrap().rate > rate
}



pub async fn cache(state: Arc<RwLock<App>>,key:String,entry:(StatusCode, Bytes),policies: Policies){
    let mut state = state.write().await;
    state.cache.insert(key,Cached_Entry{time: SystemTime::now(),entry});

}
pub async fn get_cache(state: Arc<RwLock<App>>, key: String,policies: Policies) -> Option<Response<Full<Bytes>>>{
    let state = state.read().await;
    let now = SystemTime::now();
    if state.cache.contains_key(key.as_str()){
        if now.duration_since(state.cache.get(key.as_str())?.time).unwrap().as_secs()<policies.cache_duration{

            let res = Response::builder().
                status(state.cache.get(key.as_str()).unwrap().entry.0).
                header(CONTENT_TYPE,"application/json").
                body(Full::from(state.cache.get(key.as_str()).unwrap().entry.1.clone())).unwrap();
            return Some(res);
        }
    }
    None


}
