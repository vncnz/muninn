use serde::{Serialize};

#[derive(Serialize, Clone, Debug)]
pub struct Artist {
    pub id: Option<i32>,
    pub name: String
}

#[derive(Serialize, Clone, Debug)]
pub struct ArtistStats {
    pub id: Option<i32>,
    pub name: String,
    pub listened_time: f64
}

#[derive(Serialize, Clone, Debug)]
pub struct AlbumStats {
    pub name: String,
    pub artists: String,
    pub listened_time: f64
}

#[derive(Serialize, Clone, Debug)]
pub struct SongHistoryStats {
    pub date: String,
    pub songid: i32,
    pub listened_time: f64
}

#[derive(Serialize, Clone, Debug)]
pub struct ArtistHistoryStats {
    pub date: String,
    pub artistid: i32,
    pub artistname: String,
    pub listened_time: f64
}

#[derive(Serialize, Clone, Debug)]
pub struct Song {
    pub id: Option<i32>,
    pub hash: String,
    pub title: String,
    pub album: String,
    pub length: i32,
    pub artists: Option<Vec<Artist>>,
    pub listened_time: f64
}

impl Song {
    pub fn new (evt: String) -> Option<Song> {
        // let parts = evt.split("\x1F").collect::<Vec<&str>>();
        let values: Vec<String> = evt
            .split('\x1F')
            .map(|s| s.to_string())
            .collect();

        // println!("{:?}", &values);

        if values.len() == 4 {
            let [title, artist, album, length] =
                values.try_into().expect("exactly 4 fields expected");
            let length = if let Ok(l) = length.parse::<i64>() { l } else { i64::MAX };
            let len_secs = (length as f64) / 1000.0 / 1000.0;

            let artists = artist.split(", ")
                .map(|name| Artist { id: None, name: name.to_string() })
                .collect::<Vec<Artist>>();

            return Some(Song {
                id: None,
                hash: format!("{}\x1F{}\x1F{}", title, artist, album),
                title,
                artists: Some(artists),
                album,
                length: len_secs as i32,
                listened_time: 0.0
            })
        }
        None
    }
}