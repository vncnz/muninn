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