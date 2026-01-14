import { useState, useEffect, useReducer } from "react";
// import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import Pie from "./Pie/Pie";
import { songInfo, songPlaying, songStat } from "./types";

/* function songDataReducer (_state: songInfo, evt: String): any {
  let [title, artist, album, length, position] = evt.split('|')
  return {
    title,
    artist,
    album,
    length: parseInt(length) / 1000.0 / 1000.0,
    position: parseInt(position) / 1000.0 / 1000.0
  }
} */
/* function songBuilder (evt: String): songInfo {
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
    map[el.metadata.key] = el.time
  })
} */

function App() {
  const [stats, setStats] = useState([] as songStat[]);
  const [song, setSong] = useState({ metadata: { key: '', title: '', artist: '', album: '', len_secs: 0 }, position: 0 } as songPlaying);
  // const [song, songDispatch] = useReducer(songDataReducer, { title: '', artist: '', album: '', length: 0, position: 0 } as songInfo)

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

  const downloadLyrics = (song: songInfo) => {
    // TODO: download lyrics
    console.log(song)
  }

  async function get_stats() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    let s = await invoke("get_stats", {}) as any
    // setStats(s)
    console.log(s)
  }
  async function get_stats_all() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    let s = await invoke("get_stats_all", {}) as songStat[]
    s.sort((a,b) => b.time - a.time)
    setStats(s)
    // console.log('get_stats_all', s)
  }
  function timeToHuman (time: number) {
    let m = Math.floor(time / 60)
    let mins = m > 9 ? m : ('0' + m)
    let s = Math.floor(time % 60)
    let secs = s > 9 ? s : ('0' + s)
    return `${mins}m${secs}s`
  }
  function toPercent (v: number) {
    return Math.round(v * 100) + '%'
  }

  /* let statsPie: counterDict = {}
  Object.values(stats).forEach(el => {
    let e = el as songStat
    statsPie[e.metadata.key] = e.time
  }) */
  let statsList = Object.values(stats).map(el => {
    let e = el as songStat
    // statsPie[e.metadata.key] = e.time
    return <tr><td>{e.time}s</td><td>{e.metadata.title}</td><td>{e.metadata.artist}</td><td>{e.metadata.album}</td></tr>
  })

  let songEl = song.metadata.title ? 
    <div>
      <div>Title: {song.metadata.title}</div>
      <div>Artist: {song.metadata.artist}</div>
      <div>Album: {song.metadata.album}</div>
      { song.metadata.len_secs > 0 && <div>Time: {timeToHuman(song.position)} / {timeToHuman(song.metadata.len_secs)} ({toPercent(song.position/song.metadata.len_secs)})</div> }
    </div>
    :
    <div>No playing</div>

  return (
    <main className="container">
      <div>{songEl}</div>
      {/*<button onClick={() => { get_stats() }}>Get stats</button>*/}
      <button onClick={() => { get_stats_all() }}>Get stats all</button>
      <Pie data={stats} />
      <table><tbody>{statsList}</tbody></table>
    </main>
  );
}

export default App;
