use std::fs::OpenOptions;
use std::io::Write;

pub fn log_to_file(msg: String) {
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("/tmp/galdrar.log")
        .expect("impossibile aprire log file");
    writeln!(file, "[{}] {}", chrono::Local::now().format("%H:%M:%S%.3f"), msg).unwrap();
}

pub fn to_human (secs: i64) -> String {
    format!("{:02}:{:02}", secs / 60, secs % 60)
}

use reqwest::blocking::Client as bClient;

pub fn get_song_blocking(title: &str, art: &str, alb: &str, dur: f64) -> Result<String, reqwest::Error> {
    let url = format!(
        "https://lrclib.net/api/get?artist_name={art}&track_name={title}&album_name={alb}&duration={dur}"
    );

    log_to_file("Fetching song lyrics".into());
    let client = bClient::new();
    let resp = client.get(&url).send()?.text();
    log_to_file("Fetched song lyrics".into());
    resp
    // reqwest::blocking::get(url).text()?
}