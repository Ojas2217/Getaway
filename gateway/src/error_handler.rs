use std::convert::Infallible;
use bytes::Bytes;
use http::{Response, StatusCode};
use http::header::CONTENT_TYPE;
use http_body_util::Full;
use hyper::body::Body;
use serde_json::json;

pub fn error(status: StatusCode, message: String) -> Result<Response<Full<Bytes>>, Infallible> {
    let error = json!({
            "error":message
        }).to_string();
    let res = Response::builder().
        status(status).
        header(CONTENT_TYPE,"application/json").
        body::<Full<Bytes>>(Full::from(Bytes::from(error))).unwrap();
    Ok(res)
}