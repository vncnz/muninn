import { useState, useEffect, useReducer } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

type songInfo = {
  title: String,
  artist: String,
  album: String,
  length: number,
  position: number
}

function songDataReducer (_state: songInfo, evt: String): any {
  let [title, artist, album, length, position] = evt.split('|')
  return {
    title,
    artist,
    album,
    length: parseInt(length) / 1000.0 / 1000.0,
    position: parseInt(position) / 1000.0 / 1000.0
  }
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  // const [name, setName] = useState("");
  const [song, songDispatch] = useReducer(songDataReducer, { title: '', artist: '', album: '', length: 0, position: 0 } as songInfo)

  useEffect(() => {
    // Subscribe once
    const unlisten = listen<string>("mpris-event", (event) => {
      let evt: any = event.payload
      // console.log("Ratatoskr:", evt)
      /*setEvents((events: any) => {
        return [ ...events, evt].slice(0, 100)
      })
      // dataDispatch(evt)
      allTimeEventsCounterDispatch(evt)
      lastEventMapDispatch(evt)*/
      console.log('mpris', evt)
      songDispatch(evt)
    });

    console.log("Suscribed")

    // Cleanup on unmount
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []); // empty dependency array -> run once */

  /* async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  } */
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

  let songEl = <div>
    <div>Title: {song.title}</div>
    <div>Artist: {song.artist}</div>
    <div>Album: {song.album}</div>
    <div>Time: {timeToHuman(song.position)} / {timeToHuman(song.length)} ({toPercent(song.position/song.length)})</div>
  </div>

  return (
    <main className="container">
      <p>{songEl}</p>
    </main>
  );
}

export default App;
