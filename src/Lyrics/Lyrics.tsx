import { useLyrics } from "../providers/LyricsProvider";
import { SongPlaying } from "../types";
import { timeToHuman } from "../utils";
import classes from "./Lyrics.module.scss";
import { useState, useEffect } from "react";

export function Lyrics({ playing }: { playing: SongPlaying }) {
    // const [lyricsData, setLyricsData] = useState(null as LyricsResponse | null)
    // const [loading, setLoading] = useState(false)
    // const [lastLoaded, setLastLoaded] = useState<String|null>(null)
    const [lastSelectedRowIdx, setLastSelectedRowIdx] = useState(-1)

    /* useEffect(() => {

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
                /* if (!cancelled) * / setLyricsData(data);
                console.log('Fetched lyrics', data)
                setLoading(false)
            }).catch(err => {
                console.error('Error fetching lyrics', err);
                setLoading(false)
            })
        }

        if (lastLoaded != playing.metadata.title && !loading) load();
        return () => { cancelled = true; };
    }, [playing]); */

    const { lyrics, loading, loadLyrics } = useLyrics();

    useEffect(() => {
        loadLyrics(playing);
    }, [playing, loadLyrics]);

    useEffect(() => {
        if (lyrics && lyrics.lyrics.length > 0 && lyrics.lyricsIsTimed) {
            let selectedRowIdx = lyrics.lyrics.findIndex(line => line.time > playing.position);
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
    }, [playing, lyrics])

    

    let lyricsEls = null
    if (loading) {
        lyricsEls = <div>Loading...</div>
    } else if (lyrics?.errorMessage) {
        lyricsEls = <div>Error: {lyrics.errorMessage}</div>
    } else if (lyrics?.lyricsIsTimed) {
        let lastActive = lyrics?.lyrics.reduce((acc, line, idx) => {
            if (line.time <= playing.position) return idx
            return acc
        }, 0)
        lyricsEls = lyrics?.lyrics.map((line, idx) => {
            return <div key={idx} className={classes.lyricsLine + ' ' + (line.time <= playing.position ? classes.lyricsLineOld : '') + ' ' + (idx === lastActive ? classes.lyricsLineActive : '') + ` line-${idx}`}>
                [{timeToHuman(line.time)}] {line.text}
            </div>
        })
    } else {
        lyricsEls = lyrics?.lyrics.map((line, idx) => {
            return <div key={idx} className={classes.lyricsLine}>
                {line.text}
            </div>
        })
    }
    if (!loading && lyrics?.lyrics.length == 0) {
        lyricsEls = <div>No lyrics found.</div>
    }

    return (
        <div className={classes.lyrics}>
            {lyricsEls}
        </div>
    )
}
