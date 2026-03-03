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
    pub current_idx: usize,
    pub status: LyricsState
}

impl Lyrics {
    pub fn new() -> Self {
        Self { 
            lines: vec![],
            current_idx: 1000000,
            status: LyricsState::Invalidated
        }
    }

    pub fn reset (&mut self) {
        self.lines = vec![];
        self.current_idx = 0;
        self.status = LyricsState::Invalidated;
    }

    fn current_lyric_index(&mut self, position_secs: f64) -> usize {
        self.lines.iter()
            .enumerate()
            .rev()
            .find(|(_, line)| (line.seconds as f64) <= position_secs)
            .map(|(i, _)| i)
            .unwrap_or(0)
    }

    fn update_current_lyric_index(&mut self, position_secs: f64) -> bool {
        let new_idx = self.current_lyric_index(position_secs);
        if self.current_idx != new_idx {
            self.current_idx = new_idx;
            true
        } else {
            false
        }
    }

    /* fn style_text(&mut self, position_secs: f64) -> Option<(Vec<ratatui::text::Line<'static>>, usize)> {
        let current_index = self.current_lyric_index(position_secs);
        log::info!(format!("{current_index} {}", self.rendered_index));
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

    pub fn load_text (&mut self, lyrics: &str) -> bool {

        self.status = LyricsState::Invalidated;

        let re = Regex::new(r"^\[(\d+):(\d+\.\d+)\]\s*(.*)$").unwrap();
        let mut lines = Vec::new();
        // let v: Value = serde_json::from_str(&lyrics).unwrap();

        // Accedere direttamente alla chiave
        // if let Some(synced) = v.get("syncedLyrics") {
        log::info!("syncedLyrics found");
        // println!("Synced lyrics:\n{}", synced);
        for line in lyrics.lines() {
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

        if lines.len() == 0 {
            log::info!("No lines produced");
            false
        } else {
            self.lines = lines;
            self.current_idx = 0;
            self.status = LyricsState::Loaded;
            true
        }
    }
}