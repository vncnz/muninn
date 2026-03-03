use std::fs::OpenOptions;
use anyhow::{Context, Result};
use serde::Deserialize;
use reqwest::blocking::Client;

pub fn setup_logging(quiet: bool, log_path: &str) -> anyhow::Result<()> {
    let mut config = fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{}[{}] {}",
                chrono::Local::now().format("[%Y-%m-%d][%H:%M:%S]"),
                // record.target(),
                record.level(),
                message
            ))
        })
        .level(log::LevelFilter::Info);

    // 1. Destinazione FILE (Sempre attiva)
    let log_file = OpenOptions::new()
        .write(true)
        .create(true)
        // .append(true) // if persistent
        .truncate(true) // new at each start
        .open(log_path)
        .context("Impossible to open log file in /tmp")?;
    let buffered_writer = std::io::BufWriter::new(log_file);
    
    config = config.chain(Box::new(buffered_writer) as Box<dyn std::io::Write + Send>);

    if !quiet {
        config = config.chain(std::io::stdout());
    }

    config.apply().context("Logger can't be initialized")?;
    Ok(())
}

/*
pub fn to_human (secs: i64) -> String {
    format!("{:02}:{:02}", secs / 60, secs % 60)
}

use reqwest::blocking::Client as bClient;

pub fn get_song_blocking(title: &str, art: &str, alb: &str, dur: f64) -> Result<String, reqwest::Error> {
    let url = format!(
        "https://lrclib.net/api/get?artist_name={art}&track_name={title}&album_name={alb}&duration={dur}"
    );

    log::info!("Fetching song lyrics".into());
    let client = bClient::new();
    let resp = client.get(&url).send()?.text();
    log::info!("Fetched song lyrics".into());
    resp
    // reqwest::blocking::get(url).text()?
}
*/



#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LrcResponse {
    pub id: u32,
    pub name: String,
    pub track_name: Option<String>,
    pub artist_name: Option<String>,
    pub album_name: Option<String>,
    pub duration: Option<f64>,
    pub synced_lyrics: Option<String>, // Quello che ci serve
    pub plain_lyrics: Option<String>,
}

#[derive(Debug)]
pub struct LrcQuery<'a> {
    pub artist: &'a str,
    pub title: &'a str,
    pub album: &'a str,
    pub duration: u32,
}

pub fn fetch_synced_lyrics(query: LrcQuery) -> Result<String> {
    let client = Client::builder()
        .user_agent("Muninn/1.0 (vncnz on GitHub)") 
        .build()?;

    // Costruiamo l'URL in modo sicuro gestendo l'encoding dei caratteri speciali
    let url = "https://lrclib.net/api/get";
    
    let response = client
        .get(url)
        .query(&[
            ("artist_name", query.artist),
            ("track_name", query.title),
            ("album_name", query.album),
            ("duration", &query.duration.to_string()),
        ])
        .send()
        .context("LRCLIB Request error")?;

    // Gestione degli stati HTTP non 200 (es. 404 se non trova nulla)
    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(anyhow::anyhow!("Lyrics not found for {:?}", query));
    }

    let data: LrcResponse = response
        .error_for_status()? // Converte errori 4xx/5xx in Result::Err
        .json()
        .context("Error in JSON parsing")?;

    // Estraiamo i testi sincronizzati, gestendo il caso in cui siano null/assenti
    data.synced_lyrics
        .ok_or_else(|| anyhow::anyhow!("Track ok but with no synced lyrics"))
}