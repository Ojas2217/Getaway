use std::collections::HashMap;
use std::time::SystemTime;
use bytes::Bytes;
use http::StatusCode;

pub struct RateLimit{
    pub rate:  u32,
    pub time: SystemTime
}
pub struct Cached_Entry{
    pub entry: (StatusCode, Bytes),
    pub time: SystemTime,


}
pub struct App{
    pub rates: HashMap<String,RateLimit>,
    pub cache: HashMap<String,Cached_Entry>

}