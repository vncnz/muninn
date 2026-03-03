use std::sync::{Arc, Mutex};
use std::thread;
use std::sync::mpsc::Sender;
use std::fs;

use std::sync::mpsc;
use std::os::unix::net::{UnixListener, UnixStream};
use std::io::Write;
use std::time::Duration;

use shared::SocketEventMsg;

use crate::SharedState;

pub fn start_socket_dispatcher(
    sock_path: &str,
    shared_state: Arc<Mutex<SharedState>>
) -> std::io::Result<mpsc::Sender<String>> {
    let _ = fs::remove_file(sock_path);
    let listener = UnixListener::bind(sock_path)?;
    listener.set_nonblocking(true)?;
    let clients = Arc::new(Mutex::new(Vec::<UnixStream>::new()));

    let (tx, rx) = mpsc::channel::<String>();
    let clients_accept = Arc::clone(&clients);
    let tx_clone = tx.clone();

    // Thread che accetta nuovi client
    thread::spawn(move || {
        loop {
            match listener.accept() {
                Ok((stream, _)) => {
                    log::info!("{} New client connected", chrono::Local::now().format("%H:%M:%S%.3f"));
                    stream.set_nonblocking(true).ok();
                    clients_accept.lock().unwrap().push(stream);
                    if let Ok(data) = shared_state.lock().unwrap().last_lyrics.clone().ok_or_else(|| "No lyrics".to_string()) {
                        log::info!("Sending burst with last lyrics");
                        thread::sleep(Duration::from_millis(2000));
                        // send(serde_json::Value::String(data), tx_clone.clone());
                        // tx_clone.send("burst".into()).ok();
                        if !send_string_to_socket("lyrics".to_string(), data, tx_clone.clone()) {
                            log::info!("Dispatcher terminato, chiudo thread e muoio");
                            break;
                        }
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(std::time::Duration::from_millis(100));
                }
                Err(e) => log::error!("Accept error: {e}"),
            }
        }
    });

    // Thread che invia i messaggi ai client
    let clients_send = Arc::clone(&clients);
    thread::spawn(move || {
        for msg in rx {
            let mut lock = clients_send.lock().unwrap();
            lock.retain_mut(|c| {
                if let Err(e) = c.write_all(format!("{}\n", msg).as_bytes()) {
                    log::info!("Disconnected client ({e})");
                    return false;
                }
                true
            });
        }
    });

    Ok(tx)
}

pub fn send (value: serde_json::Value, tx: mpsc::Sender<String>) -> bool {
    /*let json_val = serde_json::to_value(&value).unwrap_or_default();

    let msg = serde_json::json!({
        "resource": name,
        "warning": warn,
        "icon": icon,
        "data": serde_json::to_value(&value).unwrap()
    });*/
    let json = value.to_string();
    // let json = serde_json::to_string(&value).unwrap();

    if tx.clone().send(json).is_err() {
        false
    } else {
        true
    }
}

pub fn send_string_to_socket (resource: String, lyrics: String, tx: Sender<String>) -> bool {
    let json_val_result = serde_json::to_value(lyrics);
    if let Ok(json_val) = json_val_result {
        let msg_obj = SocketEventMsg {
            resource: resource.clone(),
            data: Some(json_val)
        };
        if let Ok(msg) = serde_json::to_value(msg_obj) {
            if !send(msg, tx) {
                log::info!("Dispatcher terminato, chiudo thread e muoio");
                return false;
            }
        } else {
            log::warn!("Can't serialize msg_obj for {resource}")
        }
    }
    return true;
}