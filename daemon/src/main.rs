use std::sync::{Arc, Mutex, mpsc};
use shared::mpris_manager::MprisManager;
use std::sync::mpsc::{Sender,Receiver};
use shared::database::StatsStore;
use shared::SongPlaying;
use shared::SharedStore;

use std::env;
use std::path::{Path, PathBuf};

mod sock;
use crate::lyrics::Lyrics;
use crate::sock::send;
use crate::sock::start_socket_dispatcher;
use crate::utils::get_song_blocking;

mod utils;
mod lyrics;

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
    println!("Starting");

    let db_path = expand_tilde(Path::new("~/.local/share/com.vncnz.muninn/stats.sqlite"));
    let store: SharedStore = Arc::new(Mutex::new(StatsStore::new(&db_path).expect("Impossible to create database")));
    let (tx_playing, rx_playing): (Sender<SongPlaying>, Receiver<SongPlaying>) = mpsc::channel();

    let tx = start_socket_dispatcher("/tmp/muninn.sock").ok();

    // Background listener
    std::thread::spawn(move || {
        MprisManager::new(store).start_listening(tx_playing);
    });

    /* loop {
        thread::sleep(Duration::from_millis(500));
    } */
    let mut last_song_id: Option<i32> = None;
    let mut last_lyrics = Lyrics::new();
    while let Ok(song) = rx_playing.recv() {
        // println!("updated mpris {}", song.metadata.title);
        let song_clone = song.clone();

        // Lyrics stuff
        let changed = song.metadata.id != last_song_id;
        if changed {
            last_song_id = song.metadata.id;
            if let Some(arts) = song.metadata.artists {
                let raw_artist = arts.iter().map(|s| s.name.clone()).collect::<Vec<String>>().join(",");
                let maybe_server_response = get_song_blocking(&song.metadata.title, &raw_artist, &song.metadata.album, song.metadata.length.into());
                let status = last_lyrics.apply_song_text(maybe_server_response);
                match status {
                    Ok(s) => {
                        println!("{s}");
                        // TODO: save!
                    },
                    Err(s) => {
                        println!("text status {s}");
                    }
                }
            }
        }

        // GUI notification
        let json_val_result = serde_json::to_value(song_clone);
        if let Ok(json_val) = json_val_result {
            if !send(json_val, tx.clone()) {
                eprintln!("Dispatcher terminato, chiudo thread e muoio");
                break;
            }
        } else {
            eprintln!("Error converting song:PlayingData to json");
        }
    }
    println!("Exiting");
}