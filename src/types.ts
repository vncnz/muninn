export type SongInfo = {
  id?: number,
  key: string,
  title: String,
  artists: Artist[],
  album: String,
  length: number,
  listened_time: number
}

export type Artist = {
  id?: number,
  name: String
}

export type AlbumStat = {
  name: String,
  artists: String,
  listened_time: number
}

export type ArtistStat = {
  id?: number,
  name: String,
  listened_time: number
}

export type SongPlaying = {
  metadata: SongInfo,
  position: number
}

export type songStat = {
  metadata: SongInfo,
  position: number
}

export type songStatTable = {
  id: number,
  title: String,
  artists: Artist[],
  album: String,
  length: number,
  listened_time: number,
  ratio: number
}

export type StatsForChart = {
  // list: songStatTable[]
  date: String,
  ids: number[]
}

export type SongHistoryStats = {
    date: String,
    songid: number,
    listened_time: number
}
export type ArtistHistoryStats = {
    date: String,
    artistid: number,
    artistname: string,
    listened_time: number
}

export type LyricsResponse = {
    albumName: string,
    artistName: string,
    duration: number,
    id: number,
    instrumental: boolean,
    name: string,
    // plainLyrics: "Lo sai che ti amo↵Ma a volte è difficile sai?↵Io mi perdo, mi strappo↵E arriviamo sempre allo stesso punto↵Sono le nove e fuori piove↵I…"
    // plainLyrics: LyricsRow[],
    // syncedLyrics: "[00:05.76] Lo sai che ti amo↵[00:07.87] Ma a volte è difficile sai?↵[00:12.67] Io mi perdo, mi strappo↵[00:16.93] E arriviamo sempre all…"
    lyrics: LyricsRow[],
    lyricsIsTimed: boolean,
    trackName: string,
    errorMessage: string|null
}

export type LyricsRow = {
    time: number,
    text: String
}