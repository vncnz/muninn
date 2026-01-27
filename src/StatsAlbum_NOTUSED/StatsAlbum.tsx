import { AlbumStat } from "../types";
import classes from "./StatsAlbum.module.scss";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { StatsAlbumRow } from "../StatsAlbumRow/StatsAlbumRow";


export function StatsAlbum () {
    const forever = -1000000
    const [albumStats, setAlbumStats] = useState([] as AlbumStat[]);
    const [periodForStats, setPeriodForStats] = useState(forever);

    const load = async () => {
        let s = await invoke("get_top_albums", { from: periodForStats }) as AlbumStat[]
        console.log('album stats', s)
        setAlbumStats(s)
    }

    useEffect(() => { load(); }, [periodForStats]);
    
    // let full = artistStats.reduce((acc: number, v: any) => acc + v.listened_time, 0)
    let max = albumStats.reduce((acc: number, v: any) => Math.max(acc, v.listened_time), 0)

    let lst = albumStats.map((album, idx) => {
        return <StatsAlbumRow album={album} max={max} key={idx} />
    })

    return (
        <div className={classes.albumStats}>
            <div className={classes.controls}>
                <span>
                    <a onClick={load}>&#8635; Refresh Album Stats</a>
                </span>
                <span>
                    <a onClick={() => setPeriodForStats(0)} className={classes.trSelector + (periodForStats === 0 ? (' '+classes.trActive) : '')}>Today</a>
                    <a onClick={() => setPeriodForStats(-6)} className={classes.trSelector + (periodForStats === -6 ? (' '+classes.trActive) : '')}>Last 7d</a>
                    <a onClick={() => setPeriodForStats(-30)} className={classes.trSelector + (periodForStats === -30 ? (' '+classes.trActive) : '')}>Last 30d</a>
                    <a onClick={() => setPeriodForStats(forever)} className={classes.trSelector + (periodForStats === forever ? (' '+classes.trActive) : '')}>Forever</a>
                </span>
            </div>
            <div className={classes.lst}>
                {lst}
            </div>
        </div>
    )
}
