import { SongInfo, SongPlaying } from "../types";
import classes from "./Lyrics.module.scss";
import { useState, useEffect } from "react";

type LyricsResponse = {
    albumName: string,
    artistName: string,
    duration: number,
    id: number,
    instrumental: boolean,
    name: string,
    // plainLyrics: "Lo sai che ti amo↵Ma a volte è difficile sai?↵Io mi perdo, mi strappo↵E arriviamo sempre allo stesso punto↵Sono le nove e fuori piove↵I…"
    plainLyrics: LyricsRow[],
    // syncedLyrics: "[00:05.76] Lo sai che ti amo↵[00:07.87] Ma a volte è difficile sai?↵[00:12.67] Io mi perdo, mi strappo↵[00:16.93] E arriviamo sempre all…"
    syncedLyrics: LyricsRow[],
    trackName: string
}

type LyricsRow = {
    timeFormatted?: string,
    time: number,
    text: String
}

export function Lyrics({ playing }: { playing: SongPlaying }) {
    const [lyrics, setLyrics] = useState([] as LyricsRow[]);
    let loadedTitle = null
    console.log('Lyrics render', playing.metadata.title)

    useEffect(() => {
        console.log('Lyrics useEffect', playing.metadata.title)
        let cancelled = false;

        async function load() {
            loadedTitle = playing.metadata.title
            const data = await fetchLyrics(playing);
            if (!data) loadedTitle = null
            if (!cancelled) setLyrics((data?.syncedLyrics || []) as LyricsRow[]);
        }

        load();
        return () => { cancelled = true; };
    }, [playing]);

    const fetchLyrics = async (song: SongPlaying): Promise<LyricsResponse | null> => {
        if (!song.metadata.title) return null;
        console.log('Fetching lyrics for', song.metadata.title);
        
        // https://lrclib.net/api/get?artist_name={art}&track_name={title}&album_name={alb}&duration={dur}
        const artists = (song.metadata.artists.map(a => a.name).join(", "))
        const response = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artists)}&track_name=${encodeURIComponent(song.metadata.title.toString())}&album_name=${song.metadata.album}&duration=${song.metadata.length}`);
        if (response.ok) {
            const data = await response.json();
            console.log('resp', data)
            let lyricsRows = [] as LyricsRow[];
            let lyricsRowsPlain = [] as LyricsRow[];
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
                        lyricsRows.push({ timeFormatted: `${minutes}:${seconds.toFixed(2)}`, time: time, text: text });
                    }
                }
            }
            if (data.plainLyrics) {
                let lines = data.plainLyrics.split("\n");
                for (let line of lines) {
                    lyricsRowsPlain.push({ time: 0, text: line.trim() });
                }
            }
            return {...data, syncedLyrics: lyricsRows, plainLyrics: lyricsRowsPlain} as LyricsResponse
            // return data as LyricsRow[];
        }
        return null
        // return [] as LyricsRow[];
    }

    let lyricsEls = lyrics.map((line, idx) => {
        return <div key={idx} className={classes.lyricLine}>
            [{(line.timeFormatted)}] {line.text}
        </div>
    });

    return (
        <div className={classes.lyrics}>
            {lyricsEls}
        </div>
    )
}
