export type songInfo = {
  key: string,
  title: String,
  artist: String,
  album: String,
  len_secs: number
}

export type songPlaying = {
  metadata: songInfo,
  position: number
}

export type songStat = {
  metadata: songInfo,
  time: number
}