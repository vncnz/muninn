import { SongInfo, songStatTable } from "../types";
import { artistsToString, timeConversion } from "../utils";
import classes from "./StatsSong.module.scss";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Column, VisualTable } from "../VisualTable/VisualTable";


export function StatsSong({ playingId }: { playingId?: number }) {
    const forever = -1000000
    const [songStats, setSongStats] = useState([] as SongInfo[]);
    const [periodForStats, setPeriodForStats] = useState(forever);
    // const [playingIdState, setPlayingIdState] = useState(playingId);

    const load = async () => {
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        let s = await invoke("get_stats_all", { from: periodForStats }) as SongInfo[]
        console.log('song stats', s)
        setSongStats(s)
    }

    const scrollToPlaying = () => {
        if (playingId === undefined) return;
        let rowEl = document.querySelector(`.row-id-${playingId}`);
        rowEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    useEffect(() => { load(); }, [periodForStats]);
    // useEffect(() => { setPlayingIdState(playingId); }, [playingId]);

    let stats2 = songStats.map((song: SongInfo) => {
        return {
            id: song.id,
            title: song.title,
            artists: song.artists,
            album: song.album,
            length: song.length,
            position: 0,
            listened_time: song.listened_time,
            ratio: song.length > 0 ? song.listened_time / song.length : 0
        } as songStatTable
    })
    let columns = [
{
            key: "listened_time",
            label: "Total\xa0time",
            // align: "right",
            format: timeConversion
        },
        { key: "ratio", label: "Count", format: (v: number) => Math.floor(v+0.1) },
        { key: "title", label: "Title" },
        { key: "artists", label: "Artist", format: artistsToString },
        { key: "album", label: "Album" },
        { key: "length", label: "Duration", format: timeConversion }
    ] as Column<songStatTable>[]

    let table = <VisualTable<songStatTable>
        unique='id'
        visualkey="listened_time"
        columns={columns}
        rows={stats2}
    />

    return (
        <div className={classes.songStats}>
            <div className={classes.controls}><a onClick={load}>&#8635; Refresh Song Stats</a><a onClick={scrollToPlaying}>&#9658; Scroll to Playing</a></div>
            {table}
        </div>
    )
}
