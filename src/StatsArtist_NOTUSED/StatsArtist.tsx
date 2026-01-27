import { ArtistStat } from "../types";
import classes from "./StatsArtist.module.scss";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { StatsArtistRow } from "../StatsArtistRow/StatsArtistRow";


export function StatsArtist () {
    const forever = -1000000
    const [artistStats, setArtistStats] = useState([] as ArtistStat[]);
    const [periodForStats, setPeriodForStats] = useState(forever);

    const load = async () => {
        let s = await invoke("get_top_artists", { from: periodForStats }) as ArtistStat[]
        console.log('artist stats', s)
        setArtistStats(s)
    }

    useEffect(() => { load(); }, [periodForStats]);

    // let full = artistStats.reduce((acc: number, v: any) => acc + v.listened_time, 0)
    let max = artistStats.reduce((acc: number, v: any) => Math.max(acc, v.listened_time), 0)

    let lst = artistStats.map((artist, idx) => {
        return <StatsArtistRow artist={artist} max={max} key={idx} />
    })

    return (
        <div className={classes.artistStats}>
            <div className={classes.controls}>
                <span>
                    <a onClick={load}>&#8635; Refresh Artist Stats</a>
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
