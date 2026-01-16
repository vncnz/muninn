export type SongInfo = {
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
  id: number,
  name: String,
  listened_time: number
}

export type songPlaying = {
  metadata: SongInfo,
  position: number
}

export type songStat = {
  metadata: SongInfo,
  position: number
}

export type songStatTable = {
  title: String,
  artists: Artist[],
  album: String,
  length: number,
  listened_time: number,
  ratio: number
}