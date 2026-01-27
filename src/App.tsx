import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { SongPlaying } from "./types";
import { Playing } from "./Playing/Playing";
import { StatsSong } from "./StatsSong/StatsSong";
import { StatsArtist } from "./StatsArtist/StatsArtist";
import { StatsAlbum } from "./StatsAlbum/StatsAlbum";
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
      // console.log('evt', event)
      let evt = event.payload as SongPlaying
      // console.log('mpris', evt)
      // let s = songBuilder(evt)
      // let songkey = stripDuration(evt)
      setSong(evt)
    });

    console.log("Suscribed")

    // Cleanup on unmount
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []); // empty dependency array -> run once
  
  function selectTab(type: string) {
    setGroupType(type)
  }

  let currentTab = null
  if (groupType == 'song') {
    currentTab = <StatsSong playingId={song.metadata.id}/>
  } else if (groupType == 'artist') {
    currentTab = <StatsArtist />
  } else if (groupType == 'album') {
    currentTab = <StatsAlbum />
  }

  return (
    <main className="container">
      <div className={"playing-info"}>
        <Playing playing={song} />
      </div>

      <div className="stats-section">
        <div className="stats-type-selector">
          <a onClick={() => { selectTab('song') }} className={groupType === 'song' ? 'active' : ''}>By song</a>
          <a onClick={() => { selectTab('artist') }} className={groupType === 'artist' ? 'active' : ''}>By artist</a>
          <a onClick={() => { selectTab('album') }} className={groupType === 'album' ? 'active' : ''}>By album</a>
        </div>
        {currentTab}
      </div>
      <div className="lyrics-section">
        <Lyrics playing={song} />
      </div>
    </main>
  );
}

export default App;
