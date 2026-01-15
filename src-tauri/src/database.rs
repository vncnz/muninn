use std::path::Path;

use rusqlite::{Connection};

use crate::mpris_manager::{SongInfo, SongStats};

pub struct StatsStore {
    conn: rusqlite::Connection,
}

impl StatsStore {
    pub fn new(app_dir: &Path) -> rusqlite::Result<Self> {
        // let conn = Connection::open_in_memory()?;
        let conn = Connection::open(app_dir)?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS song (
                id      TEXT PRIMARY KEY,
                title   TEXT NOT NULL,
                artist  TEXT,
                album   TEXT,
                len     NUMBER,
                time    NUMBER
            )",
            (), // empty list of parameters.
        )?;

        Ok(StatsStore {
            conn
        })
    }

    pub fn flush_track(&self, track: &SongStats) -> rusqlite::Result<()> {
        self.conn.execute(
            "INSERT INTO song (id, title, artist, album, len, time) VALUES (?1, ?2, ?3, ?4, ?5, ?6) on conflict (id) do update set time = time + excluded.time",
            (&track.metadata.key, &track.metadata.title, &track.metadata.artist, &track.metadata.album, &track.metadata.len_secs, &track.time),
        )?;
        Ok(())
    }

    pub fn get_all(&self) -> Vec<SongStats> {
        let mut results = Vec::new();
        let mut stmt = self.conn.prepare("SELECT id, title, artist, album, len, time FROM song order by time desc").expect("prepare ko");
        let songs = stmt.query_map([], |row| {
            Ok(SongStats {
                metadata: SongInfo {
                    key: row.get(0).expect("Id in query"),
                    title: row.get(1).expect("title in query"),
                    artist: row.get(2).expect("artist in query"),
                    album: row.get(3).expect("album in query"),
                    len_secs: row.get(4).expect("len in query")
                },
                time: row.get(5).expect("time in query")
            })
        });

        if let Ok(songs) = songs {
            for song in songs {
                if let Ok(s) = song {
                    results.push(s);
                }
            }
        }
        results
    }

    pub fn get_top_artists(&self) -> Vec<SongStats> {
        let mut results = Vec::new();
        let mut stmt = self.conn.prepare("SELECT artist, SUM(time) FROM song group by artist order by SUM(time) desc").expect("prepare ko");
        let songs = stmt.query_map([], |row| {
            Ok(SongStats {
                metadata: SongInfo {
                    key: row.get(0).expect("Artist in query"),
                    title: "".to_string(),
                    artist: row.get(0).expect("Artist in query"),
                    album: "".to_string(),
                    len_secs: 0.0
                },
                time: row.get(1).expect("sum_time in query")
            })
        });

        if let Ok(songs) = songs {
            for song in songs {
                if let Ok(s) = song {
                    results.push(s);
                }
            }
        }
        results
    }

    /* pub fn top_artists(&self, limit: usize) -> rusqlite::Result<Vec<ArtistStat>> {
        // TODO
    } */

    /* pub fn total_listening_time(&self) -> rusqlite::Result<u64> {
        // TODO
        todo!("This will be implemented in the future!");
    } */
}