import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { AlbumStat, ArtistStat, SongPlaying, songStatTable } from "./types";
import { Playing } from "./Playing/Playing";
import { Lyrics } from "./Lyrics/Lyrics";
import { StatsGeneric } from "./StatsGeneric/StatsGeneric";
import { StatsArtistRow } from "./StatsArtistRow/StatsArtistRow";
import { invoke } from "@tauri-apps/api/core";
import { StatsAlbumRow } from "./StatsAlbumRow/StatsAlbumRow";
import { StatsSongRow } from "./StatsSongRow/StatsSongRow";
import { StatsChart } from "./StatsChart/StatsChart";
import React from "react";

let StatsChartMemorized = React.memo(() => {
  return <StatsChart key='history' />
})

function App() {
  const [song, setSong] = useState({
    metadata: { key: '', title: '', artists: [], album: '', length: 0, listened_time: 0 },
    position: 0
  } as SongPlaying);

  const [groupType, setGroupType] = useState('song')
  const [showHistory, setShowHistory] = useState(true)

  
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

  const loadSongStats = useCallback(
    (from: number, to: number, limit: number) =>
      invoke("get_stats_all", { from, limit }) as Promise<songStatTable[]>,
    []
  )

  const loadArtistStats = useCallback(
    (from: number, to: number, limit: number) =>
      invoke("get_top_artists", { from, limit }) as Promise<ArtistStat[]>,
    []
  )

  const loadAlbumStats = useCallback(
    (from: number, to: number, limit: number) =>
      invoke("get_top_albums", { from, limit }) as Promise<AlbumStat[]>,
    []
  )


  let currentTab = null
  if (groupType == 'song') {
    // currentTab = <StatsSong playingId={song.metadata.id} />
    currentTab = <StatsGeneric<songStatTable>
      loadFn={loadSongStats}
      Row={({ item, max, idd }) => <StatsSongRow song={item} max={max} idd={idd} />}
      getValue={(a) => a.listened_time}
      refreshLabel="Refresh Song Stats"
      highlightId={song.metadata.id}
      key='song'
    />
  } else if (groupType == 'artist') {
    currentTab = <StatsGeneric<ArtistStat>
      loadFn={loadArtistStats}
      Row={({ item, max, idd }) => <StatsArtistRow artist={item} max={max} idd={idd} />}
      getValue={(a) => a.listened_time}
      refreshLabel="Refresh Artist Stats"
      key='artist'
    />
  } else if (groupType == 'album') {
    currentTab = <StatsGeneric<AlbumStat>
      loadFn={loadAlbumStats}
      Row={({ item, max, idd }) => <StatsAlbumRow album={item} max={max} idd={idd} />}
      getValue={(a) => a.listened_time}
      refreshLabel="Refresh Album Stats"
      key='album'
    />
  }

  return (
    <main className="container">
      { showHistory ? <StatsChartMemorized key='history' /> : null }
      <div className={"playing-info"}>
        <Playing playing={song} />
      </div>

      <div className="stats-section">
        <button onClick={() => { setShowHistory(!showHistory) }}>Show/hide history</button>
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
