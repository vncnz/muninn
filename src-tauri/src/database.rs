use std::path::Path;

use rusqlite::{Connection, Result, params};
use std::collections::HashMap;

use crate::mpris_manager::{AlbumStats, Artist, ArtistHistoryStats, ArtistStats, Song, SongHistoryStats};

use chrono;

pub struct StatsStore {
    conn: rusqlite::Connection,
}

const CURRENT_DB_VERSION: i32 = 9;
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
            // StatsStore::reset_database(&conn)?;
            // StatsStore::recreate_database(&conn)?;
            /*
                ALTER TABLE songs ADD COLUMN ignored INTEGER DEFAULT 0;
                ALTER TABLE artists ADD COLUMN ignored INTEGER DEFAULT 0;
                // So, I can add WHERE ignored = 0 in queries and ignore songs or artists chosen by the user
             */
            if version < 7 {
                StatsStore::recreate_database(&conn)?;
                println!("Upgraded/created to v7");
            }
            if version < 9 {
                StatsStore::apply9changes(&conn)?;
                println!("Upgraded to v9");
            }
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

    fn apply9changes(conn: &Connection) -> rusqlite::Result<()> {
        conn.execute_batch("
            ALTER TABLE listening_days ADD COLUMN cumulative_seconds INTEGER DEFAULT 0;

            CREATE INDEX IF NOT EXISTS idx_listening_days_query 
            ON listening_days (song_id, day DESC);

            -- Update existing rows
            UPDATE listening_days AS ld
            SET cumulative_seconds = (
                SELECT SUM(seconds)
                FROM listening_days AS inner_ld
                WHERE inner_ld.song_id = ld.song_id 
                AND inner_ld.day <= ld.day
            );
        ")?;
        Ok(())
    }

    /* pub fn flush_track(&self, track: &SongStats) -> rusqlite::Result<()> {
        self.conn.execute(
            "INSERT INTO song (id, title, artist, album, len, time) VALUES (?1, ?2, ?3, ?4, ?5, ?6) on conflict (id) do update set time = time + excluded.time, len = min(excluded.len, len)",
            (&track.metadata.key, &track.metadata.title, &track.metadata.artist, &track.metadata.album, &track.metadata.len_secs, &track.time),
        )?;
        Ok(())
    } */
    pub fn get_song_by_id(&self, id: i32) -> Result<Option<Song>> {
        self.get_song_by("", id)
    }
    pub fn get_song_by_hash(&self, hash: &str) -> Result<Option<Song>> {
        self.get_song_by(hash, 0)
    }
    pub fn get_song_by(&self, hash: &str, id: i32) -> Result<Option<Song>> {
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
            WHERE s.hash = ? or s.id = ?
            ORDER BY a.name
            "#
        )?;

        let mut rows = stmt.query(params![hash, id])?;

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
                INSERT INTO listening_days (song_id, day, seconds, cumulative_seconds)
                SELECT 
                    ?1, 
                    ?2, 
                    ?3, 
                    ?3 + COALESCE((
                        SELECT cumulative_seconds 
                        FROM listening_days 
                        WHERE song_id = ?1 AND day < ?2 
                        ORDER BY day DESC LIMIT 1
                    ), 0)
                ON CONFLICT(song_id, day) DO UPDATE SET 
                    seconds = listening_days.seconds + excluded.seconds,
                    cumulative_seconds = listening_days.cumulative_seconds + excluded.seconds;
            "#,
            params![ songid, chrono::Utc::now().format("%Y-%m-%d").to_string(), time ],
        )?;
        tx.commit()?;
        Ok(())
    }

    pub fn fix_song_length(& mut self, songid: i32, length: i32) -> Result<(), rusqlite::Error> {
        let tx = self.conn.transaction()?;

        tx.execute(
            r#"
                UPDATE songs SET length = ? where id = ?
            "#,
            params![ length, songid ],
        )?;
        println!("Updating length {length} for song {songid}");
        tx.commit()?;
        Ok(())
    }

    pub fn get_first_date(& self) -> Result<String, rusqlite::Error> {
        let date: String = self.conn.query_row("select min(day) from listening_days;", [], |row| row.get(0))?;
        Ok(date)
    }

    pub fn get_top_songs(&self, from: i32, limit: i32) -> Result<Vec<Song>> {
        let to = 0;

        let mut stmt = self.conn.prepare(
            &format!("
            WITH top_songs AS (
                SELECT
                    song_id,
                    SUM(seconds) AS listened_time
                FROM listening_days
                WHERE day >= date('now', '{from} days', 'localtime')
                AND day <= date('now', '{to} days', 'localtime')
                GROUP BY song_id
                ORDER BY listened_time DESC
                LIMIT {limit}
            )
            SELECT
                s.id,
                s.hash,
                s.title,
                s.album,
                s.length,
                ts.listened_time,
                a.id AS artist_id,
                a.name AS artist_name
            FROM top_songs ts
            JOIN songs s ON ts.song_id = s.id
            LEFT JOIN song_artists sa ON sa.song_id = s.id
            LEFT JOIN artists a ON a.id = sa.artist_id
            ORDER BY
                ts.listened_time DESC,
                a.name ASC;
            ")
        )?;

        /*
        Something like that for collapse multiple songs with same title and artist (but different album)
        SELECT
        s.title,
        GROUP_CONCAT(DISTINCT a.name) AS artists,
        SUM(ld.seconds) AS total_seconds
        FROM listening_days ld
        JOIN songs s ON ld.song_id = s.id
        JOIN song_artists sa ON sa.song_id = s.id
        JOIN artists a ON a.id = sa.artist_id
        GROUP BY lower(s.title), sa.artist_id;
         */

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


    pub fn get_top_artists(&self, from: i32, limit: i32) -> Vec<ArtistStats> {
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
            LIMIT 0,{limit}
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

    pub fn get_top_albums(&self, from: i32, limit: i32) -> Vec<AlbumStats> {
        let to = 0;

        let mut results = Vec::new();
        let mut stmt = self.conn.prepare(&format!("
            WITH song_time AS (
                SELECT
                    song_id,
                    SUM(seconds) AS listened_time
                FROM listening_days
                WHERE day >= date('now', '{from} days', 'localtime')
                AND day <= date('now', '{to} days', 'localtime')
                GROUP BY song_id
            ),
            album_time AS (
                SELECT
                    lower(s.album) AS album_key,
                    s.album AS album,
                    SUM(st.listened_time) AS total_seconds
                FROM song_time st
                JOIN songs s ON s.id = st.song_id
                WHERE s.album IS NOT NULL AND s.album != ''
                GROUP BY album_key
            )
            SELECT
                at.album,
                GROUP_CONCAT(DISTINCT a.name) AS artists,
                at.total_seconds
            FROM album_time at
            JOIN songs s ON lower(s.album) = at.album_key
            JOIN song_artists sa ON sa.song_id = s.id
            JOIN artists a ON a.id = sa.artist_id
            GROUP BY at.album, at.total_seconds
            ORDER BY at.total_seconds DESC
            LIMIT 0,{limit}
        ")).expect("select_top_albumns prepare ko");
        let albums = stmt.query_map([], |row| {
            Ok(AlbumStats {
                name: row.get(0).expect("Album in query"),
                artists: row.get(1).expect("Artists in query"),
                listened_time: row.get(2).expect("sum_time in query")
            })
        });

        if let Ok(albums) = albums {
            for album in albums {
                if let Ok(s) = album {
                    results.push(s);
                }
            }
        }
        results
    }

    pub fn get_songs_history(&self, from: i32, to: i32, limit: i32, step: i32) -> Vec<SongHistoryStats> {
        let anchor = "1970-01-01"; // Per bucket alignment

        let mut results = Vec::new();
        let mut stmt = self.conn.prepare(&format!("
            WITH bucketed AS (
                SELECT
                    date(
                        day,
                        '-' || ((julianday(day) - julianday('{anchor}')) % {step}) || ' days'
                    ) AS bucket,
                    song_id,
                    SUM(seconds) AS listened_time
                FROM listening_days
                WHERE day BETWEEN date('now', '{from} days', 'localtime')
                            AND date('now', '{to} days', 'localtime')
                GROUP BY bucket, song_id
            ),
            ranked AS (
                SELECT
                    bucket,
                    song_id,
                    listened_time,
                    ROW_NUMBER() OVER (
                        PARTITION BY bucket
                        ORDER BY listened_time DESC
                    ) AS rnk
                FROM bucketed
            )
            SELECT
                bucket,
                song_id,
                listened_time
            FROM ranked
            WHERE rnk <= {limit}
            ORDER BY bucket ASC, listened_time DESC;

        ")).expect("prepare ko");
        let songs = stmt.query_map([], |row| {
            Ok(SongHistoryStats {
                date: row.get(0).expect("Date in query"),
                songid: row.get(1).expect("SongId in query"),
                listened_time: row.get(2).expect("listened_time in query")
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

    pub fn get_artists_history(&self, from: i32, to: i32, limit: i32, step: i32) -> Vec<ArtistHistoryStats> {
        let anchor = "1970-01-01"; // Per bucket alignment

        let mut results = Vec::new();
        let mut stmt = self.conn.prepare(&format!("
WITH bucketed AS (
    SELECT
        date(
            ld.day,
            '-' || ((julianday(ld.day) - julianday('{anchor}')) % {step}) || ' days'
        ) AS bucket,
        sa.artist_id,
        SUM(ld.seconds) AS listened_time
    FROM listening_days ld
    JOIN song_artists sa ON ld.song_id = sa.song_id
    WHERE ld.day BETWEEN date('now', '{from} days', 'localtime')
                 AND date('now', '{to} days', 'localtime')
    GROUP BY bucket, sa.artist_id
),
ranked AS (
    SELECT
        bucket,
        artist_id,
        listened_time,
        ROW_NUMBER() OVER (
            PARTITION BY bucket
            ORDER BY listened_time DESC
        ) AS rnk
    FROM bucketed
)
SELECT
    r.bucket,
    r.artist_id,
    a.name AS artist_name,
    r.listened_time
FROM ranked r
JOIN artists a ON r.artist_id = a.id
WHERE r.rnk <= {limit}
ORDER BY r.bucket ASC, r.listened_time DESC;
        ")).expect("prepare ko");
        let artists = stmt.query_map([], |row| {
            Ok(ArtistHistoryStats {
                date: row.get(0).expect("Date in query"),
                artistid: row.get(1).expect("ArtistId in query"),
                artistname: row.get(2).expect("ArtistName in query"),
                listened_time: row.get(3).expect("listened_time in query")
            })
        });

        if let Ok(artists_iter) = artists {
            results.extend(artists_iter.flatten());
        }
        results
    }

    pub fn get_songs_history_cumulative(&self, from: i32, to: i32, limit: i32, step: i32) -> Vec<SongHistoryStats> {
        let anchor = "1970-01-01"; // Per bucket alignment
        let only_active = false;

        let active_filter = if only_active {
            "AND song_id IN (SELECT song_id FROM listening_days WHERE day >= date('now', '{from} days'))"
        } else {
            ""
        };

        let mut results = Vec::new();
        let mut stmt = self.conn.prepare(&format!("
            WITH RECURSIVE 
                time_grid AS (
                    SELECT date('{anchor}') AS bucket_start
                    UNION ALL
                    SELECT date(bucket_start, '+{step} days')
                    FROM time_grid
                    WHERE bucket_start < date('now', '{to} days', 'localtime')
                ),

                relevant_songs AS (
                    SELECT DISTINCT song_id 
                    FROM listening_days 
                    WHERE day <= date('now', '{to} days', 'localtime') {active_filter}
                ),

                raw_cumulative AS (
                    SELECT 
                        tg.bucket_start AS bucket,
                        s.song_id,
                        (
                            SELECT cumulative_seconds 
                            FROM listening_days ld 
                            WHERE ld.song_id = s.song_id 
                            AND ld.day < date(tg.bucket_start, '+{step} days')
                            ORDER BY ld.day DESC 
                            LIMIT 1
                        ) AS total_time
                    FROM time_grid tg
                    CROSS JOIN relevant_songs s
                    WHERE tg.bucket_start BETWEEN date('now', '{from} days', 'localtime') 
                                            AND date('now', '{to} days', 'localtime')
                ),

                ranked AS (
                    SELECT 
                        bucket,
                        song_id,
                        COALESCE(total_time, 0) AS total_time,
                        ROW_NUMBER() OVER (
                            PARTITION BY bucket 
                            ORDER BY COALESCE(total_time, 0) DESC
                        ) AS rnk
                    FROM raw_cumulative
                )

                SELECT 
                bucket,
                song_id,
                total_time
            FROM ranked
            WHERE rnk <= {limit} AND total_time > 0
            ORDER BY bucket ASC, total_time DESC;
        ")).expect("prepare ko");
        let songs = stmt.query_map([], |row| {
            Ok(SongHistoryStats {
                date: row.get(0).expect("Date in query"),
                songid: row.get(1).expect("SongId in query"),
                listened_time: row.get(2).expect("listened_time in query")
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

    pub fn get_artists_history_cumulative(&self, from: i32, to: i32, limit: i32, step: i32) -> Vec<ArtistHistoryStats> {
        let anchor = "1970-01-01"; // Per bucket alignment
        let only_active = false;

        let active_filter = if only_active {
            "AND song_id IN (SELECT song_id FROM listening_days WHERE day >= date('now', '{from} days'))"
        } else {
            ""
        };

        let mut results = Vec::new();
        let mut stmt = self.conn.prepare(&format!("
WITH RECURSIVE 

    time_grid AS (
        SELECT date('{anchor}') AS bucket_start
        UNION ALL
        SELECT date(bucket_start, '+{step} days')
        FROM time_grid
        WHERE bucket_start < date('now', '{to} days', 'localtime')
    ),

    relevant_artists AS (
        SELECT DISTINCT sa.artist_id 
        FROM song_artists sa
        JOIN listening_days ld ON sa.song_id = ld.song_id
        WHERE ld.day <= date('now', '{to} days', 'localtime') {active_filter}
    ),

    artist_data AS (
        SELECT 
            tg.bucket_start AS bucket,
            ra.artist_id,
            (
                SELECT SUM(last_song_totals.max_cum)
                FROM (
                    SELECT MAX(ld.cumulative_seconds) as max_cum
                    FROM listening_days ld
                    JOIN song_artists sa ON ld.song_id = sa.song_id
                    WHERE sa.artist_id = ra.artist_id
                      AND ld.day < date(tg.bucket_start, '+{step} days')
                    GROUP BY ld.song_id
                ) AS last_song_totals
            ) AS total_time
        FROM time_grid tg
        CROSS JOIN relevant_artists ra
        WHERE tg.bucket_start BETWEEN date('now', '{from} days', 'localtime') 
                                 AND date('now', '{to} days', 'localtime')
    ),

    ranked AS (
        SELECT 
            ad.bucket,
            ad.artist_id,
            a.name AS artist_name,
            COALESCE(ad.total_time, 0) AS total_time,
            ROW_NUMBER() OVER (
                PARTITION BY ad.bucket 
                ORDER BY COALESCE(ad.total_time, 0) DESC
            ) AS rnk
        FROM artist_data ad
        JOIN artists a ON ad.artist_id = a.id
    )

SELECT 
    bucket,
    artist_id,
    artist_name,
    total_time
FROM ranked
WHERE rnk <= {limit} AND total_time > 0
ORDER BY bucket ASC, total_time DESC;
        ")).expect("prepare ko");
        let artists = stmt.query_map([], |row| {
            Ok(ArtistHistoryStats {
                date: row.get(0).expect("Date in query"),
                artistid: row.get(1).expect("ArtistId in query"),
                artistname: row.get(2).expect("ArtistName in query"),
                listened_time: row.get(3).expect("listened_time in query")
            })
        });

        if let Ok(artists) = artists {
            for artist in artists {
                if let Ok(s) = artist {
                    results.push(s);
                }
            }
        }
        results
    }
}
