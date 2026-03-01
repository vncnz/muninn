use std::sync::{Arc, Mutex, mpsc};
use shared::mpris_manager::MprisManager;
use std::sync::mpsc::{Sender,Receiver};
use shared::database::StatsStore;
use shared::SongPlaying;
use shared::SharedStore;

use std::env;
use std::path::{Path, PathBuf};

use crate::sock::send;
use crate::sock::start_socket_dispatcher;

mod sock;

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
   while let Ok(song) = rx_playing.recv() {
        // let _ = app_handle.emit("mpris-event", song);
        println!("updated mpris {}", song.metadata.title);
        let json_val_result = serde_json::to_value(song);
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