import { useState, useEffect, useReducer } from "react";
// import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { Artist, SongInfo, songPlaying, songStat, songStatTable } from "./types";
import { VisualTable } from "./VisualTable/VisualTable";

/* function songDataReducer (_state: SongInfo, evt: String): any {
  let [title, artist, album, length, position] = evt.split('|')
  return {
    title,
    artist,
    album,
    length: parseInt(length) / 1000.0 / 1000.0,
    position: parseInt(position) / 1000.0 / 1000.0
  }
} */
/* function songBuilder (evt: String): SongInfo {
  let [title, artist, album, length, position] = evt.split('|')
  return {
    key: stripDuration(evt),
    title,
    artist,
    album,
    length: parseInt(length) / 1000.0 / 1000.0,
    position: parseInt(position) / 1000.0 / 1000.0
  }
} */

/* let stripDuration = (evt: String):String => {
  const arr = evt.split('|')
  if (arr.length === 5)
    return arr.slice(0, 4).join('|')
  return ''
} */
type counterDict = Record<string, number>;
/* function statsReducer (_state: counterDict, evt: songStat[]): any {
  let map: counterDict = {}
  evt.forEach((el: songStat) => {
    map[el.metadata.key] = el.position
  })
} */

function App() {
  const [stats, setStats] = useState([] as SongInfo[]);
  const [song, setSong] = useState({
    metadata: { key: '', title: '', artists: [], album: '', length: 0, listened_time: 0 },
    position: 0
  } as songPlaying);
  // const [song, songDispatch] = useReducer(songDataReducer, { title: '', artist: '', album: '', length: 0, position: 0 } as SongInfo)

  const [groupType, setGroupType] = useState('song')

  
  useEffect(() => {
    // Subscribe once
    const unlisten = listen<string>("mpris-event", (event: any) => {
      console.log('evt', event)
      let evt = event.payload as songPlaying
      console.log('mpris', evt)
      // let s = songBuilder(evt)
      // let songkey = stripDuration(evt)
      if (evt.metadata.key != song.metadata.key) {
        downloadLyrics(evt.metadata)
      }
      setSong(evt)
    });

    console.log("Suscribed")

    // Cleanup on unmount
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []); // empty dependency array -> run once

  const downloadLyrics = (song: SongInfo) => {
    // TODO: download lyrics
    console.log(song)
  }
  async function get_stats(type: string, params: any) {
    params = params || {}
    setGroupType(type)
    let s: SongInfo[] = []
    if (type === 'artist') {
      s = await invoke("get_top_artists", {}) as SongInfo[]
    } else if (type === 'song') {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
      s = await invoke("get_stats_all", {}) as SongInfo[]
    }
    // s.sort((a,b) => b.position - a.position)
    setStats(s)
    console.log('get_stats', s)
  }
  function timeToHuman (time: number) {
    let m = Math.floor(time / 60)
    let mins = m > 9 ? m : ('0' + m)
    let s = Math.floor(time % 60)
    let secs = s > 9 ? s : ('0' + s)
    return `${mins}:${secs}`
  }
  function toPercent (v: number) {
    return Math.round(v * 100) + '%'
  }
  function timeConversion (secs: number) {

      const minutes = (secs / 60).toFixed(1);
      const hours = (secs / (60 * 60)).toFixed(1);
      const days = (secs / (60 * 60 * 24)).toFixed(1);

      if (secs < 60) {
          return secs + "\xa0Sec";
      } else if (parseFloat(minutes) < 60) {
          return minutes + "\xa0Min";
      } else if (parseFloat(hours) < 24) {
          return hours + "\xa0Hrs";
      } else {
          return days + "\xa0Days"
      }
  }

  /* let statsPie: counterDict = {}
  Object.values(stats).forEach(el => {
    let e = el as songStat
    statsPie[e.metadata.key] = e.position
  }) */

    const artistsToString = (artists: Artist[]) => { return artists.map((a: Artist) => a.name).join(', ') }

  let artist = artistsToString(song.metadata.artists)
  let songEl = song.metadata.title ? 
    <div>
      <div>Title: {song.metadata.title}</div>
      <div>Artist: {artist}</div>
      <div>Album: {song.metadata.album}</div>
      { song.metadata.length > 0 && <div>Time: {timeToHuman(song.position)} / {timeToHuman(song.metadata.length)} ({toPercent(song.position/song.metadata.length)})</div> }
    </div>
    :
    <div>No playing</div>
  
  let stats2 = stats.map((song: SongInfo) => {
    return {
      title: song.title,
      artists: song.artists,
      album: song.album,
      length: song.length,
      position: 0,
      listened_time: song.listened_time,
      ratio: song.length > 0 ? song.listened_time / song.length : 0
    } as songStatTable
  })

  let columns: any[] = []
  if (groupType === 'song') 
    columns = [
          {
            key: "listened_time",
            label: "Total\xa0time",
            // align: "right",
            format: timeConversion
          },
          { key: "ratio", label: "Count", format: (v: number) => Math.floor(v+0.1) },
          { key: "title", label: "Title" },
          { key: "artists", label: "Artist", format: artistsToString },
          { key: "album", label: "Album" },
          { key: "length", label: "Duration", format: timeConversion }
        ]
  else if (groupType === 'artist') 
    columns = [
          {
            key: "position",
            label: "Total\xa0time",
            // align: "right"
            format: timeConversion
          },
          { key: "artists", label: "Artist", format: artistsToString }
        ]
    

  return (
    <main className="container">
      <h1>Current song</h1>
      <div>{songEl}</div>
      {/*<button onClick={() => { get_stats() }}>Get stats</button>*/}

      <h1>Statistics</h1>
      <div className="buttons">
        <button onClick={() => { get_stats('song', {}) }}>By song</button>
        <button onClick={() => { get_stats('artist', {}) }}>By artist</button>
      </div>
      {/*<Pie data={stats} />*/}
      <VisualTable<songStatTable>
        visualkey="position"
        columns={columns}
        rows={stats2}
      />
    </main>
  );
}

export default App;
