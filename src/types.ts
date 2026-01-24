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