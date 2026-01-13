mod mpris_manager;
mod database;
use std::{path::Path, sync::{Arc, Mutex}};
use crate::{database::StatsStore, mpris_manager::{MprisManager, SongStats}};
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
fn get_stats_all(store: tauri::State<'_, SharedStore>) -> Result<Vec<SongStats>, String> {
    let store = store.lock().expect("StatsStore poisoned");
    Ok(store.get_all())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // let manager = Arc::new(Mutex::new(MprisManager::new()));
            let app_handle = app.handle().clone();
            let stats: SharedStats = Arc::new(RwLock::new(HashMap::new()));
            let store: SharedStore = Arc::new(Mutex::new(StatsStore::new(Path::new("/tmp/muninn.sqlite")).expect("Impossible to create database")));

            // Register as global state
            app.manage(stats.clone());
            app.manage(store.clone());

            let stats_clone = stats.clone();

            // Background listener
            std::thread::spawn(move || {
                MprisManager::new().start_listening(stats_clone, store, app_handle);
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        // .invoke_handler(tauri::generate_handler![get_stats_all])
        .invoke_handler(tauri::generate_handler![get_stats, get_stats_all])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
