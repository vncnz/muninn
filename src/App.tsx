import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { SongInfo, SongPlaying } from "./types";
import { Playing } from "./Playing/Playing";
import { StatsSong } from "./StatsSong/StatsSong";
import { StatsArtist } from "./StatsArtist/StatsArtist";
import { Lyrics } from "./Lyrics/Lyrics";

function App() {
  const [song, setSong] = useState({
    metadata: { key: '', title: '', artists: [], album: '', length: 0, listened_time: 0 },
    position: 0
  } as SongPlaying);

  const [groupType, setGroupType] = useState('song')

  
  useEffect(() => {
    // Subscribe once
    const unlisten = listen<string>("mpris-event", (event: any) => {
      console.log('evt', event)
      let evt = event.payload as SongPlaying
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

  
  function selectTab(type: string) {
    setGroupType(type)
  }

  let currentTab = null
  if (groupType == 'song') {
    currentTab = <StatsSong />
  } else if (groupType == 'artist') {
    currentTab = <StatsArtist />
  } else if (groupType == 'lyrics') {
    currentTab = <Lyrics playing={song} />
  }

  return (
    <main className="container">
      <h1>Current song</h1>
      <Playing playing={song} />

      <h1>Statistics</h1>
      <div className="buttons">
        <button onClick={() => { selectTab('song') }}>By song</button>
        <button onClick={() => { selectTab('artist') }}>By artist</button>
        <button onClick={() => { selectTab('lyrics') }}>Lyrics</button>
      </div>
      {currentTab}
    </main>
  );
}

export default App;
