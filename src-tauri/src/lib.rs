mod mpris_manager;
use std::sync::{Arc, Mutex};
use crate::mpris_manager::{MprisManager, SongStats};
use std::collections::HashMap;
use tauri::{Manager};
use std::sync::{RwLock};

type SharedStats = Arc<RwLock<HashMap<String, SongStats>>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_stats(state: tauri::State<'_, SharedStats>) -> Result<HashMap<String, SongStats>, String> {
    let stats = state.read().map_err(|_| "Stats poisoned")?;
    Ok(stats.iter().map(|(k,v)| (k.clone(), v.clone())).collect())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // let manager = Arc::new(Mutex::new(MprisManager::new()));
            let app_handle = app.handle().clone();
            let stats: SharedStats = Arc::new(RwLock::new(HashMap::new()));

            // Register as global state
            app.manage(stats.clone());

            let stats_clone = stats.clone();

            // Background listener
            std::thread::spawn(move || {
                MprisManager::new().start_listening(stats_clone, app_handle);
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![get_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
