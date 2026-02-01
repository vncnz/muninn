import { SongPlaying } from "../types";
import { timeToHuman } from "../utils";
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
    // plainLyrics: LyricsRow[],
    // syncedLyrics: "[00:05.76] Lo sai che ti amo↵[00:07.87] Ma a volte è difficile sai?↵[00:12.67] Io mi perdo, mi strappo↵[00:16.93] E arriviamo sempre all…"
    lyrics: LyricsRow[],
    lyricsIsTimed: boolean,
    trackName: string,
    errorMessage: string|null
}

type LyricsRow = {
    time: number,
    text: String
}

export function Lyrics({ playing }: { playing: SongPlaying }) {
    const [lyricsData, setLyricsData] = useState(null as LyricsResponse | null)
    const [loading, setLoading] = useState(false)
    const [lastLoaded, setLastLoaded] = useState<String|null>(null)
    const [lastSelectedRowIdx, setLastSelectedRowIdx] = useState(-1)

    useEffect(() => {

        if (lyricsData && lyricsData.lyrics.length > 0 && lyricsData.lyricsIsTimed) {
            let selectedRowIdx = lyricsData.lyrics.findIndex(line => line.time > playing.position);
            if (selectedRowIdx !== lastSelectedRowIdx) {
                setLastSelectedRowIdx(selectedRowIdx);
                let lineEl = document.querySelector(`.line-${selectedRowIdx}`);
                if (lineEl) {
                    lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    console.log('Scrolled to line idx', selectedRowIdx)
                } else {
                    console.log('No lineEl found for idx', selectedRowIdx)
                }
            }
        }

        let cancelled = false;

        async function load() {
            setLoading(true)
            setLastLoaded(playing.metadata.title)
            fetchLyrics(playing).then(data => {
                if (!data) setLastLoaded(null)
                /* if (!cancelled) */ setLyricsData(data);
                console.log('Fetched lyrics', data)
                setLoading(false)
            }).catch(err => {
                console.error('Error fetching lyrics', err);
                setLoading(false)
            })
        }

        if (lastLoaded != playing.metadata.title && !loading) load();
        return () => { cancelled = true; };
    }, [playing]);

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

    let lyricsEls = null
    if (loading) {
        lyricsEls = <div>Loading...</div>
    } else if (lyricsData?.errorMessage) {
        lyricsEls = <div>Error: {lyricsData.errorMessage}</div>
    } else if (lyricsData?.lyricsIsTimed) {
        let lastActive = lyricsData?.lyrics.reduce((acc, line, idx) => {
            if (line.time <= playing.position) return idx
            return acc
        }, 0)
        lyricsEls = lyricsData?.lyrics.map((line, idx) => {
            return <div key={idx} className={classes.lyricsLine + ' ' + (line.time <= playing.position ? classes.lyricsLineOld : '') + ' ' + (idx === lastActive ? classes.lyricsLineActive : '') + ` line-${idx}`}>
                [{timeToHuman(line.time)}] {line.text}
            </div>
        })
    } else {
        lyricsEls = lyricsData?.lyrics.map((line, idx) => {
            return <div key={idx} className={classes.lyricsLine}>
                {line.text}
            </div>
        })
    }
    if (!loading && lyricsData?.lyrics.length == 0) {
        lyricsEls = <div>No lyrics found.</div>
    }

    return (
        <div className={classes.lyrics}>
            {lyricsEls}
        </div>
    )
}
