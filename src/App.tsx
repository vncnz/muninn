import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { SongInfo, songPlaying } from "./types";
import { Playing } from "./Playing/Playing";
import { StatsSong } from "./StatsSong/StatsSong";
import { StatsArtist } from "./StatsArtist/StatsArtist";

function App() {
  const [song, setSong] = useState({
    metadata: { key: '', title: '', artists: [], album: '', length: 0, listened_time: 0 },
    position: 0
  } as songPlaying);

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

  
  function show_stats(type: string) {
    setGroupType(type)
  }

  return (
    <main className="container">
      <h1>Current song</h1>
      <Playing playing={song} />

      <h1>Statistics</h1>
      <div className="buttons">
        <button onClick={() => { show_stats('song') }}>By song</button>
        <button onClick={() => { show_stats('artist') }}>By artist</button>
      </div>
      {groupType === 'song' ? <StatsSong /> : <StatsArtist />}
    </main>
  );
}

export default App;
