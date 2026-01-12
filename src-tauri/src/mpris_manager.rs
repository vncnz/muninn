use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;
use tauri::Emitter;

pub struct MprisManager {
    // TODO
}

impl MprisManager {
    pub fn new () -> MprisManager {
        MprisManager {}
    }

    pub fn start_listening (&self, app: AppHandle) {
        // let _ = app.emit("mpris-event", msg);

        let mut last_active_player: String = String::new();

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
            let position = pc_position(&active_player);

            let _ = app.emit("mpris-event", format!("{track_key}|{position}"));
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
