use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;
use tauri::Emitter;
use serde::{Serialize};

use crate::SharedStore;

const MAX_VALID_LENGTH_SECS: f64 = 86400.0;
const MIN_TIME_TO_SAVE_SECS: f64 = 10.0;

#[derive(Serialize, Clone, Debug)]
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
pub struct Song {
    pub id: Option<i32>,
    pub hash: String,
    pub title: String,
    pub album: String,
    pub length: i32,
    pub artists: Option<Vec<Artist>>,
    pub listened_time: f64
}

impl Song {
    fn new (evt: String) -> Option<Song> {
        // let parts = evt.split("|").collect::<Vec<&str>>();
        let values: Vec<String> = evt
            .split('|')
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

            return Some(Song {
                id: None,
                hash: format!("{}|{}|{}", title, artist, album),
                title,
                artists: Some(artists),
                album,
                length: len_secs as i32,
                listened_time: 0.0
            })
        }
        None
    }
}







/* pub struct SongArtist {
    pub song_id: i32,
    pub artist_id: i32
} */

#[derive(Serialize, Clone, Default)]
pub struct SongInfo {
  pub key: String,
  pub title: String,
  pub artist: String,
  pub album: String,
  pub len_secs: f64
}

/* fn get_song_hash(title: &str, artist: &str, album: &str) -> String {
    format!("{}|{}|{}", title, artist, album)
} */

fn strip_length_from_string(s: &str) -> (String, String) {
    let parts: Vec<&str> = s.rsplitn(2, '|').collect();
    if parts.len() == 2 {
        return (parts[1].to_string(), parts[0].to_string());
    }
    (s.to_string(), "".to_string())
}

impl SongInfo {
    fn new (evt: String) -> Option<SongInfo> {
        // let parts = evt.split("|").collect::<Vec<&str>>();
        let values: Vec<String> = evt
            .split('|')
            .map(|s| s.to_string())
            .collect();

        // println!("{:?}", &values);

        if values.len() == 4 {
            let [title, artist, album, length] =
                values.try_into().expect("exactly 4 fields expected");
            let length = if let Ok(l) = length.parse::<i64>() { l } else { i64::MAX };
            let len_secs = (length as f64) / 1000.0 / 1000.0;

            return Some(SongInfo {
                key: format!("{}|{}|{}", title, artist, album),
                title,
                artist,
                album,
                len_secs
            })
        }
        None
    }
}
/* impl PartialEq for SongInfo {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
    }
} */

#[derive(Serialize, Clone)]
struct SongPlaying {
    metadata: Song,
    position: f64
}

#[derive(Serialize, Clone, Default)]
pub struct SongStats {
    pub(crate) metadata: SongInfo,
    pub(crate) time: f64
}

pub struct MprisManager {
    // pub stats: HashMap<String, SongStats>
}

impl MprisManager {
    pub fn new () -> MprisManager {
        MprisManager {
            // stats: HashMap::new()
        }
    }

    pub fn start_listening (&mut self, shared_store: SharedStore, app: AppHandle) {
        // let _ = app.emit("mpris-event", msg);

        // let mut last_active_player: String = String::new();

        let mut current: Option<Song> = None;
        // current.metadata.len_secs = MAX_VALID_LENGTH_SECS + 1.0;
        let mut last_position = -1.0;
        let mut cumulative_time = 0.0;

        loop {
            thread::sleep(Duration::from_millis(900));

            // Getting the list of open players
            let players_out = Command::new("playerctl")
                .arg("--list-all")
                .output();

            let players_raw = match players_out {
                Ok(out) => String::from_utf8_lossy(&out.stdout).to_string(),
                Err(_) => continue,
            };

            let players: Vec<String> = players_raw
                .lines()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();

            if players.is_empty() {
                continue;
            }

            // Looking for an active player
            let mut active: Option<String> = None;

            for p in &players {
                let status_out = Command::new("playerctl")
                    .arg("-p").arg(p)
                    .arg("status")
                    .output();

                if let Ok(out) = status_out {
                    let st = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if st == "Playing" {
                        active = Some(p.clone());
                        break;
                    }
                }
            }

            let Some(active_player) = active else {
                continue;
            };

            // Forcing refresh if active player is not the same
            /*let force_update = active_player != last_active_player;
            if force_update {
                last_active_player = active_player.clone();
            }*/

            // Getting the metadata string
            let track_key = pc_allmeta(&active_player); // format!("{}|{}|{}|{}", title, artist, album, duration_raw);
            let position = parse_position(pc_position(&active_player));

            let [ track_hash, length ] = strip_length_from_string(&track_key).try_into().expect("exactly 2 fields expected");
            // println!("Track hash: {}, length: {}", track_hash, length);

            if current.is_none() || current.as_ref().unwrap().hash != track_hash {
                if current.is_some() {
                    let mut store = shared_store.lock().expect("StatsStore poisoned");
                    eprintln!("Flushing track {} ({}) with time {}", current.as_ref().unwrap().hash, current.as_ref().unwrap().id.unwrap_or_else(|| 0), cumulative_time);
                    store.increase_time(current.as_ref().unwrap().id.unwrap(), cumulative_time).expect("Impossible to update time");
                }
                let on_database: Option<Song> = {
                    let store = shared_store.lock().expect("StatsStore poisoned");
                    // println!("Looking for track hash {:?} ({}) in database", track_hash, track_hash.len());
                    if let Ok(opt_song) = store.get_song_by_hash(&track_hash) {
                        if let Some(song) = opt_song {
                            println!("Found track {} in database", song.id.unwrap());
                            Some(song)
                        } else {
                            println!("Track {} not found in database", track_hash);
                            None
                        }
                    } else {
                        println!("Track {} not found in database -- QUERY ERROR", track_hash);
                        None
                    }
                };

                if on_database.is_some() {
                    current = on_database;
                } else {
                    current = Song::new(track_key.clone());
                    let mut store = shared_store.lock().expect("StatsStore poisoned");
                    println!("Inserting new track {:?} ({}) into database", current.as_ref().unwrap().hash, current.as_ref().unwrap().hash.len());
                    current = Some(store.insert_song(current.as_ref().unwrap()).expect("Impossible to insert song"));
                }
                cumulative_time = 0.0;
            }

            if last_position < position {
                cumulative_time += 1.0;
            }
            last_position = position;
            let _ = app.emit("mpris-event", SongPlaying { metadata: current.clone().unwrap(), position });
/*
            let opt_listening = SongInfo::new(track_key);

            let Some(listening) = opt_listening else {
                continue;
            };

            if listening.key != current.metadata.key {
                if current.metadata.len_secs < MAX_VALID_LENGTH_SECS && current.time > MIN_TIME_TO_SAVE_SECS {
                    let store = shared_store.lock().expect("StatsStore poisoned");
                    if let Ok(_) = store.flush_track(&current) {}
                }
                current = SongStats { metadata: listening.clone(), time: 0.0 };
            } else if current.metadata.len_secs > MAX_VALID_LENGTH_SECS && listening.len_secs <= MAX_VALID_LENGTH_SECS {
                current.metadata.len_secs = listening.len_secs;
            }
            if (last_position < position) {
                current.time += 1.0;
            }
            last_position = position;

            let _ = app.emit("mpris-event", SongPlaying { metadata: listening, position });
*/
            // let _ = app.emit("mpris-event", format!("{track_key}|{position}"));
            /*let changed = force_update || track_key != last_track_key;
            if !changed {
                continue;
            }

            last_track_key = track_key.clone();

            // 5. Aggiorna SongState
            let mut do_fetch = false;

            // 4. Leggi metadata dal player attivo
            let mut title: String = "".into();
            let mut artist = pc_meta(&active_player, "artist");
            let mut album = pc_meta(&active_player, "album");
            let mut duration_secs = 0.0;

            if let Ok(mut s) = state.lock() {
                let updated = s.update_metadata(&track_key);

                if updated || force_update {
                    title = s.title.clone();
                    artist = s.artist.clone();
                    album = s.album.clone();
                    duration_secs = s.len_secs;
                    s.lyrics.reset();
                    do_fetch = true;
                }
            }

            if !do_fetch {
                continue;
            }

            // 6. Notifiche UI
            if duration_secs < 1.0 || duration_secs > 3600.0 {
                let _ = tx_notify.send(format!("Wrong length {duration_secs}"));
                continue;
            }
            if artist.trim().is_empty() {
                let _ = tx_notify.send("No artist".into());
                continue;
            }*/

            // let maybe_server_response = get_song_blocking(&title, &artist, &album, duration_secs);
        }
        // });
    }
}

fn parse_position(pos: String) -> f64 {
    let p: f64 = pos.parse().unwrap();
    let new_pos_secs = p / 1000.0 / 1000.0;
    new_pos_secs
}

pub fn pc_position(player: &str) -> String {
    let output = Command::new("playerctl")
        .arg("-p").arg(player)
        .arg("metadata")
        .arg("--format")
        .arg("'{{position}}'")
        .output();
        // .expect("failed to run playerctl for position");
    let position_dirt = String::from_utf8(output.unwrap().stdout).unwrap();
    if position_dirt != "" { 
        let mut chars = position_dirt.chars();
        chars.next();
        chars.next_back();
        chars.next_back();

        let position: String = chars.collect();
        // let p: f64 = position.parse().unwrap();
        // let new_pos_secs = p / 1000.0 / 1000.0;
        return position;
    }
    // else { false }
    "0".to_string()
}

// Helper for all metadata
fn pc_allmeta(player: &str) -> String {
    let out = Command::new("playerctl")
        .arg("-p").arg(player)
        .arg("metadata")
        .arg("--format")
        .arg("{{title}}|{{artist}}|{{album}}|{{mpris:length}}")
        .output();

    match out {
        Ok(o) => String::from_utf8_lossy(&o.stdout).trim().to_string(),
        Err(_) => "".into(),
    }
}

// Helper for single metadata item
fn pc_meta(player: &str, field: &str) -> String {
    let out = Command::new("playerctl")
        .arg("-p").arg(player)
        .arg("metadata")
        .arg(field)
        .output();

    match out {
        Ok(o) => String::from_utf8_lossy(&o.stdout).trim().to_string(),
        Err(_) => "".into(),
    }
}

fn pc_template(player: &str, field: &str) -> String {
    let out = Command::new("playerctl")
        .arg("-p").arg(player)
        .arg("metadata")
        .arg("--format")
        .arg(field)
        .output();

    match out {
        Ok(o) => String::from_utf8_lossy(&o.stdout).trim().to_string(),
        Err(_) => "".into(),
    }
}
