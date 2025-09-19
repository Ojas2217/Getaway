use serde::{Deserialize,Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RateLimit {
    pub rate_limit_requests: u32,
    pub rate_limit_window: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Authorization {
    pub tokens: Vec<String>,
    pub users: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Policies {
    pub backend: String,
    pub path_prefix: String,
    pub rate_limit: RateLimit,
    pub authorization: Authorization,
    pub cache_duration: u64,
    pub request_timeout: u64
}
