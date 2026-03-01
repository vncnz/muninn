// use ratatui::{style::{Color, Modifier, Style}, text::{Line, Span}};
use serde_derive::Deserialize;
use regex::Regex;
use serde_json::Value;

use super::utils::*;

pub enum LyricsState {
    Loaded,
    // Loading,
    // Missing,
    // Error,
    Invalidated
}

#[derive(Deserialize)]
pub struct LyricLine {
    pub seconds: i64,
    pub lyrics: String,
}

pub struct Lyrics {
    pub lines: Vec<LyricLine>,
    // pub rendered_text: Vec<ratatui::text::Line<'static>>,
    pub rendered_index: usize,
    pub status: LyricsState
}

impl Lyrics {
    pub fn new() -> Self {
        Self { 
            lines: vec![],
            // rendered_text: vec![],
            rendered_index: 1000000,
            status: LyricsState::Invalidated
        }
    }

    pub fn reset (&mut self) {
        self.lines = vec![];
        // self.rendered_text = vec![];
        self.rendered_index = 1000000;
    }

    fn current_lyric_index(&mut self, position_secs: f64) -> usize {
        self.lines.iter()
            .enumerate()
            .rev()
            .find(|(_, line)| (line.seconds as f64) <= position_secs)
            .map(|(i, _)| i)
            .unwrap_or(0)
    }

    /* fn style_text(&mut self, position_secs: f64) -> Option<(Vec<ratatui::text::Line<'static>>, usize)> {
        let current_index = self.current_lyric_index(position_secs);
        log_to_file(format!("{current_index} {}", self.rendered_index));
        if current_index != self.rendered_index {
            let lines: Vec<Line> = self.lines.iter().enumerate().map(|(i, line)| {
                let style = if i == current_index {
                    Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)
                } else {
                    Style::default()
                };
                Line::from(vec![
                    Span::raw(format!("{} ", to_human(line.seconds))),
                    Span::styled(line.lyrics.clone(), style),
                ])
            }).collect();
            Some((lines, current_index))
        } else {
            None
        }
    } */

    /* pub fn update_style_text(&mut self, position_secs: f64) -> bool {
        if let Some((t, idx)) = self.style_text(position_secs) {
            // self.rendered_text = t;
            let changed = self.rendered_index < idx;
            self.rendered_index = idx;
            return changed;
        }
        false
    } */

    pub fn apply_song_text (&mut self, maybe_server_response: Result<String, reqwest::Error>) -> Result<String, String> {
        // TODO Manage the case syncedLyrics is null and plainLyrics is not null
        let mut status: String = String::new();

        match maybe_server_response {
            Ok(server_response) => {
                log_to_file(server_response.clone());
                let parsed: Value = serde_json::from_str(&server_response).unwrap();
                if let Some(status_code) = parsed.get("statusCode") { // API error
                    // Example: {"message":"Failed to find specified track","name":"TrackNotFound","statusCode":404}
                    status = parsed["message"].as_str().unwrap().to_string();
                    log_to_file(format!("status: {status_code} {status}"));
                    self.status = LyricsState::Invalidated;
                } else if let Some(synced) = parsed.get("syncedLyrics") { // We have the lyrics!
                    let unformatted_text = synced.as_str().unwrap();
                    if self.convert_text(unformatted_text) {
                        // text_changed = true;
                        status = "Lyrics loaded and parsed successfully".into();
                        log_to_file(status.clone());
                        self.status = LyricsState::Loaded;
                        return Ok(unformatted_text.to_string());
                    } else {
                        status = "Something's wrong (1)".into();
                        log_to_file(status.clone());
                        self.status = LyricsState::Invalidated;
                    }
                } else {
                    status = "Something's wrong (2)".into();
                    log_to_file(status.clone());
                    self.status = LyricsState::Invalidated;
                }
            },
            Err(e) => {
                self.status = LyricsState::Invalidated;
                status = "Error".into();
                log_to_file(format!("Error: {}", e));
            }
        }
        log_to_file(format!("NEW: {status}"));
        Err(status)
    }


    pub fn set_text(&mut self, lines: Vec<LyricLine>) {
        self.lines = lines;
        self.rendered_index = 0;
        // let current_index = self.current_lyric_index(position_secs);
        // self.update_style_text(0.0);
    }

    pub fn convert_text (&mut self, synced: &str) -> bool {

        let re = Regex::new(r"^\[(\d+):(\d+\.\d+)\]\s*(.*)$").unwrap();
        let mut lines = Vec::new();
        // let v: Value = serde_json::from_str(&lyrics).unwrap();

        // Accedere direttamente alla chiave
        // if let Some(synced) = v.get("syncedLyrics") {
            log_to_file("syncedLyrics found".into());
            // println!("Synced lyrics:\n{}", synced);
            for line in synced.lines() {
                if let Some(caps) = re.captures(line) {
                    let minutes: i64 = caps[1].parse().unwrap_or(0);
                    let seconds: f64 = caps[2].parse().unwrap_or(0.0);
                    let total_seconds = (minutes * 60) as f64 + seconds;
                    lines.push(LyricLine {
                        seconds: total_seconds.round() as i64,
                        lyrics: caps[3].to_string(),
                    });
                }
            }
        /* } else {
            log_to_file("syncedLyrics NOT found".into());
            log_to_file(format!("{v}"));
        } */

        if lines.len() == 0 {
            log_to_file("No lines produced".into());
            false
        } else {
            self.set_text(lines);
            true
        }
    }
}