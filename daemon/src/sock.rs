use std::sync::{Arc, Mutex};
use std::thread;

use std::fs;

use std::sync::mpsc;
use std::os::unix::net::{UnixListener, UnixStream};
use std::io::Write;

pub fn start_socket_dispatcher(
    sock_path: &str
) -> std::io::Result<mpsc::Sender<String>> {
    let _ = fs::remove_file(sock_path);
    let listener = UnixListener::bind(sock_path)?;
    listener.set_nonblocking(true)?;
    let clients = Arc::new(Mutex::new(Vec::<UnixStream>::new()));

    let (tx, rx) = mpsc::channel::<String>();
    let clients_accept = Arc::clone(&clients);
    // let tx_clone = tx.clone();

    // Thread che accetta nuovi client
    thread::spawn(move || {
        loop {
            match listener.accept() {
                Ok((stream, _)) => {
                    println!("{} New client connected", chrono::Local::now().format("%H:%M:%S%.3f"));
                    stream.set_nonblocking(true).ok();
                    clients_accept.lock().unwrap().push(stream);
                    // println!("About to lock s and send burst");
                    /* if let Ok(data) = s.lock() {
                        // thread::sleep(Duration::from_millis(2000));
                        send_burst(&data, tx_clone.clone());
                        // tx_clone.send("burst".into()).ok();
                    } */
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(std::time::Duration::from_millis(100));
                }
                Err(e) => eprintln!("Accept error: {e}"),
            }
        }
    });

    // Thread che invia i messaggi ai client
    let clients_send = Arc::clone(&clients);
    thread::spawn(move || {
        for msg in rx {
            // eprintln!("msg in rx {:?}", msg);
            let mut lock = clients_send.lock().unwrap();
            // eprintln!("rx len {}, sending msg {:?}", lock.len(), msg);
            lock.retain_mut(|c| {
                // eprintln!("lock.retain_mut");
                if let Err(e) = c.write_all(format!("{}\n", msg).as_bytes()) {
                    eprintln!("Disconnected client ({e})");
                    return false;
                }
                true
            });
        }
    });

    Ok(tx)
}

pub fn send (value: serde_json::Value, tx: Option<mpsc::Sender<String>>) -> bool {
    match tx {
        Some(ttx) => {
            /*let json_val = serde_json::to_value(&value).unwrap_or_default();

            let msg = serde_json::json!({
                "resource": name,
                "warning": warn,
                "icon": icon,
                "data": serde_json::to_value(&value).unwrap()
            });*/
            let json = value.to_string();
            // let json = serde_json::to_string(&value).unwrap();
    
            if ttx.clone().send(json).is_err() {
                false
            } else {
                true
            }
        },
        _ => {
            false
        }
    }

}


/*
if !send($name.to_string(), json_val, tx.clone()) {
    eprintln!("Dispatcher terminato, chiudo thread di {}", $name);
    break;
}
*/