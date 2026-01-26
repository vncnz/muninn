mod mpris_manager;
mod database;
use std::{sync::{Arc, Mutex}};
use crate::{database::StatsStore, mpris_manager::{ArtistStats, MprisManager, Song, SongStats}};
use std::collections::HashMap;
use tauri::{Manager};
use std::sync::{RwLock};

type SharedStats = Arc<RwLock<HashMap<String, SongStats>>>;
type SharedStore = Arc<Mutex<StatsStore>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn get_stats(state: tauri::State<'_, SharedStats>) -> Result<HashMap<String, SongStats>, String> {
    let stats = state.read().map_err(|_| "Stats poisoned")?;
    Ok(stats.iter().map(|(k,v)| (k.clone(), v.clone())).collect())

    // let store = store.lock().expect("StatsStore poisoned");
    // store.flush_track(&current_track)?;
}

#[tauri::command]
fn get_stats_all(store: tauri::State<'_, SharedStore>, from: i32) -> Result<Vec<Song>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_top_songs(from).expect("Impossible to get songs"))
}

#[tauri::command]
fn get_top_artists(store: tauri::State<'_, SharedStore>, from: i32) -> Result<Vec<ArtistStats>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_top_artists(from))
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

            // let stats: SharedStats = Arc::new(RwLock::new(HashMap::new()));
            let store: SharedStore = Arc::new(Mutex::new(StatsStore::new(&db_path).expect("Impossible to create database")));

            // Register as global state
            // app.manage(stats.clone());
            app.manage(store.clone());

            // let stats_clone = stats.clone();

            // Background listener
            std::thread::spawn(move || {
                MprisManager::new().start_listening(store, app_handle);
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        // .invoke_handler(tauri::generate_handler![get_stats_all])
        .invoke_handler(tauri::generate_handler![get_stats, get_stats_all, get_top_artists])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
