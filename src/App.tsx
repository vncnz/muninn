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
import { SongsHistoryChart } from "./SongsHistoryChart/SongsHistoryChart";
import { ArtistsHistoryChart } from "./ArtistsHistoryChart/ArtistsHistoryChart";
import React from "react";
import { LyricsProvider } from "./providers/LyricsProvider";

let SongsHistoryChartMemorized = React.memo(() => {
  return <SongsHistoryChart key='historyS' />
})
let ArtistsHistoryChartMemorized = React.memo(() => {
  return <ArtistsHistoryChart key='historyA' />
})

function App() {
  const [song, setSong] = useState({
    metadata: { key: '', title: '', artists: [], album: '', length: 0, listened_time: 0 },
    position: 0
  } as SongPlaying);

  const [groupType, setGroupType] = useState('song')
  const [showHistory, setShowHistory] = useState<null|'songs'|'artists'>('songs')

  
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

  function nextHistory () {
    if (!showHistory) setShowHistory('songs')
    else if (showHistory === 'songs') setShowHistory('artists')
    else setShowHistory(null)
  }
  
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

  const filterSongs = (item: songStatTable, query: string) => {
    return item.title.toLowerCase().indexOf(query) > -1 ||
           item.album.toLowerCase().indexOf(query) > -1 ||
           item.artists.some(a => a.name.toLowerCase().indexOf(query) > -1)
  }
  const filterArtists = (item: ArtistStat, query: string) => {
    return item.name.toLowerCase().indexOf(query) > -1
  }

  let currentTab = null
  if (groupType == 'song') {
    // currentTab = <StatsSong playingId={song.metadata.id} />
    currentTab = <StatsGeneric<songStatTable>
      loadFn={loadSongStats}
      Row={({ item, max }) => <StatsSongRow song={item} max={max} idd={item.id} />}
      getValue={(a) => a.listened_time}
      refreshLabel="Refresh Song Stats"
      highlightId={song.metadata.id}
      key='song'
      filterFunction={filterSongs}
    />
  } else if (groupType == 'artist') {
    currentTab = <StatsGeneric<ArtistStat>
      loadFn={loadArtistStats}
      Row={({ item, max, idd }) => <StatsArtistRow artist={item} max={max} idd={idd} />}
      getValue={(a) => a.listened_time}
      refreshLabel="Refresh Artist Stats"
      key='artist'
      filterFunction={filterArtists}
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

  let hist = null
  if (showHistory === 'songs') hist = <SongsHistoryChartMemorized key='historyS' />
  if (showHistory === 'artists') hist = <ArtistsHistoryChartMemorized key='historyA' />

  return (
    <main className="container">
      { hist }
      <div className={"playing-info"}>
        <Playing playing={song} />
      </div>

      <div className="stats-section">
        <button className="toggle-graph-button" onClick={() => {nextHistory()}}>{showHistory ? '✕' : '∑'}</button>
        <div className="stats-type-selector">
          <a onClick={() => { selectTab('song') }} className={groupType === 'song' ? 'active' : ''}>By song</a>
          <a onClick={() => { selectTab('artist') }} className={groupType === 'artist' ? 'active' : ''}>By artist</a>
          <a onClick={() => { selectTab('album') }} className={groupType === 'album' ? 'active' : ''}>By album</a>
        </div>
        {currentTab}
      </div>
      <div className="lyrics-section">
        <LyricsProvider>
          <Lyrics playing={song} />
        </LyricsProvider>
      </div>
    </main>
  );
}

export default App;
