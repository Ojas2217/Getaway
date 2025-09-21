use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RateLimit {
    pub rate_limit_requests: u32,
    pub rate_limit_window: u64,
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Policies {
    pub backend: String,
    pub path_prefix: String,
    pub rate_limit: RateLimit,
    pub authorization: HashMap<String,String>,
    pub cache_duration: u64,
    pub request_timeout: u64
}
