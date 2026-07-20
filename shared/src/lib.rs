use std::{collections::HashMap, sync::{Arc, Mutex, RwLock}};

use serde::{Deserialize, Serialize};

use crate::database::StatsStore;

pub mod database;

#[derive(Serialize, Clone, Default)]
pub struct SongInfo {
  pub key: String,
  pub title: String,
  pub artist: String,
  pub album: String,
  pub len_secs: f64
}

#[derive(Serialize, Clone, Default)]
pub struct SongStats {
    pub(crate) metadata: SongInfo,
    pub(crate) time: f64
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct SongPlaying {
    pub metadata: Song,
    pub position: f64
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Artist {
    pub id: Option<i32>,
    pub name: String
}

#[derive(Serialize, Clone, Debug)]
pub struct ArtistStats {
    pub id: Option<i32>,
    pub name: String,
    pub listened_time: f64
}

#[derive(Serialize, Clone, Debug)]
pub struct AlbumStats {
    pub name: String,
    pub artists: String,
    pub listened_time: f64
}

#[derive(Serialize, Clone, Debug)]
pub struct SongHistoryStats {
    pub date: String,
    pub songid: i32,
    pub listened_time: f64
}

#[derive(Serialize, Clone, Debug)]
pub struct ArtistHistoryStats {
    pub date: String,
    pub artistid: i32,
    pub artistname: String,
    pub listened_time: f64
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub enum SongState {
    OnDatabase,
    ToBeSaved,
    Volatile
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub enum SongType {
    Song,
    Youtube,
    Movie,
    Other,
    Unknown
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Song {
    pub id: Option<i32>,
    pub hash: String,
    pub title: String,
    pub album: String,
    pub length: i32,
    pub artists: Option<Vec<Artist>>,
    pub listened_time: f64,
    // pub songtype: SongType // TODO: use this field in the constructor and for logic
}

impl Song {
    pub fn new (evt: String) -> Option<Song> {
        // let parts = evt.split("\x1F").collect::<Vec<&str>>();
        let values: Vec<String> = evt
            .split('\x1F')
            .map(|s| s.to_string())
            .collect();

        // println!("{:?}", &values);

        if values.len() == 4 {
            let [title, artist, album, length] =
                values.try_into().expect("exactly 4 fields expected");
            let length = if let Ok(l) = length.parse::<i64>() { l } else { i64::MAX };
            let len_secs = (length as f64) / 1000.0 / 1000.0;

            let artists = artist.split(", ")
                .map(|name| Artist { id: None, name: name.to_string() })
                .collect::<Vec<Artist>>();

            /* let songtype = if url.contains("youtube") { SongType::Youtube }
                else if url.contains(".mov") || url.contains(".mkv") || url.contains(".mp4") { SongType::Movie }
                else if url.contains("reddit") || track_key.contains("Advertisement") { SongType::Other }
                else if artist.len() > 0 { SongType::Song } else { SongType::Unknown }; */
            let songtype = SongType::Unknown; // TODO


            return Some(Song {
                id: None,
                hash: format!("{}\x1F{}\x1F{}", title, artist, album),
                title,
                artists: if artist.len() > 0 { Some(artists) } else { None },
                album,
                length: len_secs as i32,
                listened_time: 0.0
                // songtype
            })
        }
        None
    }
}

pub type SharedStats = Arc<RwLock<HashMap<String, SongStats>>>;
pub type SharedStore = Arc<Mutex<StatsStore>>;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct SocketEventMsg {
    pub resource: String,
    pub data: Option<serde_json::Value> // Option<SongPlaying>
}