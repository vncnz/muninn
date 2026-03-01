use std::sync::{Arc, Mutex, mpsc};
use std::sync::mpsc::{Sender,Receiver};
use shared::database::StatsStore;
use shared::{AlbumStats, ArtistHistoryStats, ArtistStats, SharedStats, SharedStore, Song, SongHistoryStats, SongStats, SongPlaying};
use std::collections::HashMap;
use tauri::{Emitter, Manager};

mod sock_listener;
use crate::sock_listener::ListenerSocket;
use std::time::Duration;

/* impl Drop for StatsStore {
    fn drop(&mut self) {
        eprintln!("DROP2");
    }
} */

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn get_first_date(store: tauri::State<'_, SharedStore>) -> Result<String, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_first_date().expect("Failed to get first date"))
}

#[tauri::command]
fn get_stats(state: tauri::State<'_, SharedStats>) -> Result<HashMap<String, SongStats>, String> {
    let stats = state.read().map_err(|_| "Stats poisoned")?;
    Ok(stats.iter().map(|(k,v)| (k.clone(), v.clone())).collect())

    // let store = store.lock().expect("StatsStore poisoned");
    // store.flush_track(&current_track)?;
}

#[tauri::command]
fn get_stats_all(store: tauri::State<'_, SharedStore>, from: i32, limit: i32) -> Result<Vec<Song>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_top_songs(from, limit).expect("Impossible to get songs"))
}

#[tauri::command]
fn get_top_artists(store: tauri::State<'_, SharedStore>, from: i32, limit: i32) -> Result<Vec<ArtistStats>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_top_artists(from, limit))
}

#[tauri::command]
fn get_top_albums(store: tauri::State<'_, SharedStore>, from: i32, limit: i32) -> Result<Vec<AlbumStats>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_top_albums(from, limit))
}

#[tauri::command]
fn get_songs_history(store: tauri::State<'_, SharedStore>, from: i32, to: i32, limit: i32, step: i32) -> Result<Vec<SongHistoryStats>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_songs_history(from, to, limit, step))
}
#[tauri::command]
fn get_artists_history(store: tauri::State<'_, SharedStore>, from: i32, to: i32, limit: i32, step: i32) -> Result<Vec<ArtistHistoryStats>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_artists_history(from, to, limit, step))
}
#[tauri::command]
fn get_songs_history_cumulative(store: tauri::State<'_, SharedStore>, from: i32, to: i32, limit: i32, step: i32) -> Result<Vec<SongHistoryStats>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_songs_history_cumulative(from, to, limit, step))
}

#[tauri::command]
fn get_artists_history_cumulative(store: tauri::State<'_, SharedStore>, from: i32, to: i32, limit: i32, step: i32) -> Result<Vec<ArtistHistoryStats>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_artists_history_cumulative(from, to, limit, step))
}

#[tauri::command]
fn get_songs_by_id(store: tauri::State<'_, SharedStore>, idx: Vec<i32>) -> Result<Vec<Song>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    let mut results = Vec::<Song>::new();
    for id in idx {
        if let Ok(Some(song)) = store.get_song_by_id(id) {
            results.push(song)
        }
    }
    Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // let manager = Arc::new(Mutex::new(MprisManager::new()));
            let app_handle = app.handle().clone();

            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            std::fs::create_dir_all(&data_dir)
                .expect("Failed to create app data dir");

            let db_path = data_dir.join("stats.sqlite");
            println!("Database path: {:?}", db_path);

            let store: SharedStore = Arc::new(Mutex::new(StatsStore::new(&db_path).expect("Impossible to create database")));

            // Register as global state
            app.manage(store.clone());

            let mut sock = ListenerSocket::new("/tmp/muninn.sock");

            std::thread::spawn(move || {
                loop {
                    sock.poll_messages();
                    if let Ok(data) = sock.rx.try_recv() {
                        eprintln!("New event {:?}", data);
                        let _ = app_handle.emit("mpris-event", data);
                    }
                    std::thread::sleep(Duration::from_millis(50));
                }
            });

            // let stats_clone = stats.clone();

            // let (tx_playing, rx_playing): (Sender<SongPlaying>, Receiver<SongPlaying>) = mpsc::channel();

            // let _ = app.emit("mpris-event", SongPlaying { metadata: current.clone().unwrap(), position });

            // Background listener
            /*std::thread::spawn(move || {
                MprisManager::new(store).start_listening(tx_playing);
            });*/

            /*std::thread::spawn(move || {
                while let Ok(song) = rx_playing.recv() {
                    let _ = app_handle.emit("mpris-event", song);
                }
                println!("Closed MPRIS channel");
            });*/

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_stats, get_first_date, get_stats_all, get_top_artists, get_top_albums, get_songs_history, get_artists_history, get_songs_history_cumulative, get_songs_by_id, get_artists_history_cumulative])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
