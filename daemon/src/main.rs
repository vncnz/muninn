use std::sync::{Arc, Mutex, mpsc};
use std::sync::mpsc::{Sender,Receiver};
use shared::database::StatsStore;
use shared::SongPlaying;
use shared::SharedStore;

use std::env;
use std::path::{Path, PathBuf};

mod sock;
use crate::sock::send_string_to_socket;
use crate::sock::start_socket_dispatcher;
use crate::utils::LrcQuery;
use crate::utils::fetch_synced_lyrics;
use crate::utils::setup_logging;

mod utils;
mod lyrics;

mod mpris_manager;
use crate::mpris_manager::MprisManager;

fn expand_tilde(path: &Path) -> PathBuf {
    let s = path.to_str().unwrap_or("");
    if s.starts_with('~') {
        let home = env::var("HOME").expect("Variabile $HOME non impostata");
        PathBuf::from(s.replacen('~', &home, 1))
    } else {
        path.to_path_buf()
    }
}

fn main() {
    setup_logging(true, "/tmp/muninn_daemon.log").expect("Can't initialize logger!");
    log::info!("Starting");

    let db_path = expand_tilde(Path::new("~/.local/share/com.vncnz.muninn/stats.sqlite"));
    let store: SharedStore = Arc::new(Mutex::new(StatsStore::new(&db_path).expect("Impossible to create database")));
    let store2 = store.clone();
    let (tx_playing, rx_playing): (Sender<SongPlaying>, Receiver<SongPlaying>) = mpsc::channel();

    let shared_state = Arc::new(Mutex::new(SharedState { last_lyrics: None }));
    let tx = start_socket_dispatcher("/tmp/muninn.sock", shared_state.clone()).ok();

    // Background listener
    std::thread::spawn(move || {
        MprisManager::new(store).start_listening(tx_playing);
    });

    daemon_loop(rx_playing, store2, tx, shared_state);
    log::info!("Exiting");
}

struct SharedState {
    last_lyrics: Option<String>,
}

fn daemon_loop (rx_playing: Receiver<SongPlaying>, store2: Arc<Mutex<StatsStore>>, tx: Option<Sender<String>>, shared_state: Arc<Mutex<SharedState>>) {
    let mut last_song_id: Option<i32> = None;
    
    // let mut lyrics_engine = Lyrics::new();
    while let Ok(song) = rx_playing.recv() {
        if let Some(song_id) = song.metadata.id {
            let song_clone = song.clone();

            // Lyrics stuff
            let changed = song.metadata.id != last_song_id;
            last_song_id = song.metadata.id;
            if changed {
                let read = store2.lock().unwrap().get_lyrics_by_song_id(song_id);
                if let Ok((lyrics, _synced)) = read {
                    log::info!("Lyrics found in the database");
                    shared_state.lock().unwrap().last_lyrics = Some(lyrics.clone());
                    if !send_string_to_socket("lyrics".to_string(), lyrics, tx.clone().unwrap().clone()) {
                        break;
                    }
                } else {
                    log::info!("No lyrics in the database");

                    if let Some(arts) = song.metadata.artists {
                        let raw_artist = arts.iter().map(|s| s.name.clone()).collect::<Vec<String>>().join(",");

                        let resp = fetch_synced_lyrics(LrcQuery {
                            artist: &raw_artist,
                            title: &song.metadata.title,
                            album: &song.metadata.album,
                            duration: song.metadata.length as u32
                        });

                        match resp {
                            Ok(lyrics) => {
                                log::info!("About to insert");
                                if let Err(err) = store2.lock().unwrap().insert_lyrics(song_id, lyrics.clone(), true) {
                                    log::info!("Error inserting lyrics in the database {err}");
                                } else {
                                    log::info!("Lyrics inserted in the database");
                                }
                                shared_state.lock().unwrap().last_lyrics = Some(lyrics.clone());
                                if !send_string_to_socket("lyrics".to_string(), lyrics, tx.clone().unwrap().clone()) {
                                    break;
                                }
                            },
                            Err(err) => {
                                log::error!("{:?}", err);
                            }
                        }
                    } else {
                        log::warn!("No artists");
                    }
                }
            }

            // GUI notification
            let json_val_result = serde_json::to_value(song_clone);
            if let Ok(json_val) = json_val_result {
                if !send_string_to_socket("playing".to_string(), json_val.to_string(), tx.clone().unwrap().clone()) {
                    log::info!("Dispatcher terminated, exiting...");
                    break;
                }
            } else {
                log::warn!("Error converting song:PlayingData to json");
            }
        }
    }
}