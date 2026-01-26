use std::path::Path;

use rusqlite::{Connection, Result, params};
use std::collections::HashMap;

use crate::mpris_manager::{Artist, ArtistStats, Song};

use chrono;

pub struct StatsStore {
    conn: rusqlite::Connection,
}

const CURRENT_DB_VERSION: i32 = 7;
impl StatsStore {
    pub fn new(app_dir: &Path) -> rusqlite::Result<Self> {
        // let conn = Connection::open_in_memory()?;
        let conn = Connection::open(app_dir)?;

        let version: i32 = conn.query_row(
            "PRAGMA user_version;",
            [],
            |row| row.get(0),
        )?;

        if version < CURRENT_DB_VERSION {
            println!("Upgrading database from version {} to {}", version, CURRENT_DB_VERSION);
            // destructive reset (early stage)
            StatsStore::reset_database(&conn)?;
            StatsStore::recreate_database(&conn)?;
            conn.execute(
                &format!("PRAGMA user_version = {};", CURRENT_DB_VERSION),
                [],
            )?;
        } else {
            /* conn.execute_batch("
                reindex idx_artists_name;
                reindex idx_song_artists_song;
                reindex idx_song_artists_artist;
            ")?; */
            println!("Database version {} is up to date", version);
        }

        Ok(StatsStore { conn })
    }

    fn reset_database(conn: &Connection) -> rusqlite::Result<()> {
        conn.execute("DROP TABLE IF EXISTS song;", [])?;
        conn.execute("DROP TABLE IF EXISTS songs;", [])?;
        conn.execute("DROP TABLE IF EXISTS artists;", [])?;
        conn.execute("DROP TABLE IF EXISTS song_artists;", [])?;
        Ok(())
    }

    fn recreate_database(conn: &Connection) -> rusqlite::Result<()> {
        conn.execute_batch(
            r#"CREATE TABLE songs (
                    id INTEGER PRIMARY KEY,
                    hash TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    album TEXT NOT NULL,
                    length INTEGER NOT NULL
                );

                CREATE TABLE artists (
                    id INTEGER PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL
                );

                CREATE TABLE song_artists (
                    song_id INTEGER NOT NULL,
                    artist_id INTEGER NOT NULL,
                    UNIQUE(song_id, artist_id)
                );

                CREATE TABLE listening_days (
                    song_id INTEGER NOT NULL,
                    day DATE NOT NULL,
                    seconds INTEGER NOT NULL,
                    PRIMARY KEY (song_id, day),
                    FOREIGN KEY (song_id) REFERENCES songs(id)
                );
                
                CREATE INDEX idx_artists_name ON artists(name);
                CREATE INDEX idx_song_artists_song ON song_artists(song_id);
                CREATE INDEX idx_song_artists_artist ON song_artists(artist_id);
            "#
        )?;
        Ok(())
    }

    /* pub fn flush_track(&self, track: &SongStats) -> rusqlite::Result<()> {
        self.conn.execute(
            "INSERT INTO song (id, title, artist, album, len, time) VALUES (?1, ?2, ?3, ?4, ?5, ?6) on conflict (id) do update set time = time + excluded.time, len = min(excluded.len, len)",
            (&track.metadata.key, &track.metadata.title, &track.metadata.artist, &track.metadata.album, &track.metadata.len_secs, &track.time),
        )?;
        Ok(())
    } */

    pub fn get_song_by_hash(&self, hash: &str) -> Result<Option<Song>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT
                s.id,
                s.hash,
                s.title,
                s.album,
                s.length,
                -- s.listened_time,
                a.id,
                a.name
            FROM songs s
            LEFT JOIN song_artists sa ON sa.song_id = s.id
            LEFT JOIN artists a ON a.id = sa.artist_id
            WHERE s.hash = ?
            ORDER BY a.name
            "#
        )?;

        let mut rows = stmt.query(params![hash])?;

        // println!("Querying song by hash: {:?}, {} results", hash, rows.size_hint().0);

        let mut song: Option<Song> = None;
        let mut artists: Vec<Artist> = Vec::new();

        while let Some(row) = rows.next()? {
            // println!("Processing row for song id: {:?}", row.get::<_, Option<i32>>(0)?);
            if song.is_none() {
                song = Some(Song {
                    id: Some(row.get(0)?),
                    hash: row.get(1)?,
                    title: row.get(2)?,
                    album: row.get(3)?,
                    length: row.get(4)?,
                    listened_time: 0.0,
                    artists: None,
                });
            }

            let artist_id: Option<i32> = row.get(5)?;
            let artist_name: Option<String> = row.get(6)?;

            if let (Some(id), Some(name)) = (artist_id, artist_name) {
                artists.push(Artist {
                    id: Some(id),
                    name,
                });
            }
        }

        if let Some(mut s) = song {
            if !artists.is_empty() {
                s.artists = Some(artists);
            }
            // println!("gsbh - Found song for hash: {:?}", hash);
            Ok(Some(s))
        } else {
            // println!("gsbh - No song found for hash: {:?}", hash);
            Ok(None)
        }
    }

    pub fn insert_song(& mut self, song: &Song) -> Result<Song> {
        let tx = self.conn.transaction()?;

        // Insert song
        tx.execute(
            r#"
            INSERT INTO songs (hash, title, album, length)
            VALUES (?, ?, ?, ?)
            "#,
            params![
                song.hash,
                song.title,
                song.album,
                song.length
            ],
        )?;

        let song_id = tx.last_insert_rowid() as i32;

        // Insert artists (if any) and collect IDs
        let mut artists_with_id = Vec::new();

        if let Some(artists) = &song.artists {
            for artist in artists {
                // Insert artist if missing
                tx.execute(
                    r#"
                    INSERT INTO artists (name)
                    VALUES (?)
                    ON CONFLICT(name) DO NOTHING
                    "#,
                    params![artist.name],
                )?;

                // Retrieve artist id
                let artist_id: i32 = tx.query_row(
                    r#"
                    SELECT id FROM artists WHERE name = ?
                    "#,
                    params![artist.name],
                    |row| row.get(0),
                )?;

                // Insert association
                tx.execute(
                    r#"
                    INSERT INTO song_artists (song_id, artist_id)
                    VALUES (?, ?)
                    ON CONFLICT DO NOTHING
                    "#,
                    params![song_id, artist_id],
                )?;

                artists_with_id.push(Artist {
                    id: Some(artist_id),
                    name: artist.name.clone(),
                });
            }
        }

        tx.commit()?;

        // Return fully hydrated Song
        Ok(Song {
            id: Some(song_id),
            hash: song.hash.clone(),
            title: song.title.clone(),
            album: song.album.clone(),
            length: song.length,
            listened_time: 0.0,
            artists: if artists_with_id.is_empty() {
                None
            } else {
                Some(artists_with_id)
            },
        })
    }

    pub fn increase_time(& mut self, songid: i32, time: f64) -> Result<(), rusqlite::Error> {
        let tx = self.conn.transaction()?;

        tx.execute(
            r#"
                INSERT INTO listening_days (song_id, day, seconds)
                VALUES (?, ?, ?)
                ON CONFLICT(song_id, day)
                DO UPDATE SET seconds = seconds + excluded.seconds;
            "#,
            params![ songid, chrono::Utc::now().format("%Y-%m-%d").to_string(), time ],
        )?;
        tx.commit()?;
        Ok(())
    }

    pub fn get_top_songs(&self, from: i32) -> Result<Vec<Song>> {
        let to = 0;

        let mut stmt = self.conn.prepare(
            &format!("
            SELECT
                s.id,
                s.hash,
                s.title,
                s.album,
                s.length,
                d.listened_time,
                a.id,
                a.name
            FROM (
                SELECT song_id, SUM(seconds) AS listened_time
                FROM listening_days
                WHERE day >= date('now', '{from} days', 'localtime') and day <= date('now', '{to} days', 'localtime')
                GROUP BY song_id
            ) d
            LEFT JOIN songs s ON d.song_id = s.id
            LEFT JOIN song_artists sa ON sa.song_id = s.id
            LEFT JOIN artists a ON a.id = sa.artist_id
            ORDER BY d.listened_time DESC, a.name ASC
            ")
        )?;

        let mut rows = stmt.query([])?;

    let mut songs: Vec<Song> = Vec::new();
    let mut index: HashMap<i32, usize> = HashMap::new();

    while let Some(row) = rows.next()? {
        let song_id: i32 = row.get(0)?;

        let song_pos = if let Some(&pos) = index.get(&song_id) {
            pos
        } else {
            let song = Song {
                id: Some(song_id),
                hash: row.get(1)?,
                title: row.get(2)?,
                album: row.get(3)?,
                length: row.get(4)?,
                listened_time: row.get(5)?,
                artists: Some(Vec::new()),
            };
            songs.push(song);
            let pos = songs.len() - 1;
            index.insert(song_id, pos);
            pos
        };

        // Artist may be NULL (LEFT JOIN)
        let artist_id: Option<i32> = row.get(6)?;
        if artist_id.is_some() {
            let artist = Artist {
                id: artist_id,
                name: row.get(7)?,
            };
            songs[song_pos].artists.as_mut().unwrap().push(artist);
        }
    }

    Ok(songs)
    }


    pub fn get_top_artists(&self, from: i32) -> Vec<ArtistStats> {
        let to = 0;

        let mut results = Vec::new();
        let mut stmt = self.conn.prepare(&format!("
            SELECT
                a.id,
                a.name,
                SUM(d.listened_time) AS total_listened_time
            FROM (
                SELECT song_id, SUM(seconds) AS listened_time
                FROM listening_days
                WHERE day >= date('now', '{from} days', 'localtime') and day <= date('now', '{to} days', 'localtime')
                GROUP BY song_id
            ) d
            JOIN songs s         ON s.id = d.song_id
            JOIN song_artists sa ON sa.song_id = s.id
            JOIN artists a       ON a.id = sa.artist_id
            GROUP BY a.id, a.name
            ORDER BY total_listened_time DESC
        ")).expect("prepare ko");
        let songs = stmt.query_map([], |row| {
            Ok(ArtistStats {
                id: Some(row.get(0).expect("Artist id in query")),
                name: row.get(1).expect("Artist in query"),
                listened_time: row.get(2).expect("sum_time in query")
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
}