import { useCallback, useRef, useState } from "react";
// import { LyricsContext } from "./LyricsContext";
import { LyricsResponse, LyricsRow, SongPlaying } from "../types";

import { createContext, useContext } from "react"

type LyricsContextValue = {
  lyrics: LyricsResponse | null
  loading: boolean
  loadLyrics: (song: SongPlaying) => Promise<LyricsResponse | null>
}

export const LyricsContext = createContext<LyricsContextValue | null>(null);

const fetchLyrics = async (song: SongPlaying): Promise<LyricsResponse | null> => {
        if (!song.metadata.title) return null;
        console.log('Fetching lyrics for', song.metadata.title);
        
        // https://lrclib.net/api/get?artist_name={art}&track_name={title}&album_name={alb}&duration={dur}
        const artists = (song.metadata.artists.map(a => a.name).join(", "))
        const response = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artists)}&track_name=${encodeURIComponent(song.metadata.title.toString())}&album_name=${encodeURIComponent(song.metadata.album.toString())}&duration=${song.metadata.length}`);
        if (response.ok) {
            const data = await response.json();
            console.log('resp', data)
            let lyricsRows = [] as LyricsRow[];
            let isPlain: boolean = false
            if (data.syncedLyrics) {
                let lines = data.syncedLyrics.split("\n");
                console.log('lines.length', lines.length)
                for (let line of lines) {
                    let match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
                    if (match) {
                        let minutes = parseInt(match[1]);
                        let seconds = parseFloat(match[2]);
                        let text = match[3].trim();
                        let time = minutes * 60 + seconds;
                        lyricsRows.push({ time: time, text: text });
                    }
                }
            } else if (data.plainLyrics) {
                isPlain = true
                let lines = data.plainLyrics.split("\n");
                for (let line of lines) {
                    lyricsRows.push({ time: 0, text: line.trim() });
                }
            }
            return {...data, lyrics: lyricsRows, lyricsIsTimed: !isPlain} as LyricsResponse
            // return data as LyricsRow[];
        } else {
            const data = await response.json();
            if (data.message) {
                return { errorMessage: data.message, lyrics: [], lyricsIsTimed: false } as unknown as LyricsResponse
            }
        }
        return null
        // return [] as LyricsRow[];
    }

export function LyricsProvider({ children }: { children: React.ReactNode }) {
  const [lyrics, setLyrics] = useState<LyricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const cacheRef = useRef<Map<number, LyricsResponse>>(new Map());

  const loadLyrics = useCallback(async (song: SongPlaying) => {
    if (!song.metadata.id) return null;

    const songId = song.metadata.id;

    const cached = cacheRef.current.get(songId);
    if (cached) {
      setLyrics(cached);
      return cached;
    }

    setLoading(true)
    const fetched = await fetchLyrics(song);
    setLoading(false)
    if (!fetched) {
      return null;
    }

    cacheRef.current.set(songId, fetched);
    setLyrics(fetched);

    return fetched;
  }, []);

  return (
    <LyricsContext.Provider value={{ lyrics, loading, loadLyrics }}>
      {children}
    </LyricsContext.Provider>
  );
}

export function useLyrics() {
  const ctx = useContext(LyricsContext);
  if (!ctx) throw new Error("useLyrics must be used inside LyricsProvider");
  return ctx;
}