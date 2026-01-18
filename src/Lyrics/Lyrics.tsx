import { SongInfo } from "../types";
import classes from "./Lyrics.module.scss";
import { useState, useEffect } from "react";

type LyricsRow = {
    time: number,
    text: String
}

export function Lyrics(playing: SongInfo) {
    const [lyrics, setLyrics] = useState([] as LyricsRow[]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const data = await fetchLyrics(playing);
            if (!cancelled) setLyrics(data);
        }

        load();
        return () => { cancelled = true; };
    }, [playing]);

    const fetchLyrics = async (song: SongInfo) => {
        console.log('[TODO] fetching lyrics for', song.title);
        /* const response = await fetch(`http://localhost:8000/lyrics?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artists.map(a => a.name).join(", "))}`);
        if (response.ok) {
            const data = await response.json();
            return data as LyricsRow[];
        } */
        return [] as LyricsRow[];
    }

    let lyricsEls = lyrics.map((line, idx) => {
        return <div key={idx} className={classes.lyricLine}>
            {line.text}
        </div>
    });

    return (
        <div className={classes.lyrics}>
            {lyricsEls}
        </div>
    )
}
