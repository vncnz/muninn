import { ArtistStat } from "../types";
import { timeConversion } from "../utils";
import classes from "./StatsArtist.module.scss";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Column, VisualTable } from "../VisualTable/VisualTable";


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

    let columns = [
          {
            key: "listened_time",
            label: "Total\xa0time",
            // align: "right"
            format: timeConversion
          },
          { key: "name", label: "Artist" }
        ] as Column<ArtistStat>[]

    let table = <VisualTable<ArtistStat>
          unique="id"
          visualkey="listened_time"
          columns={columns}
          rows={artistStats}
        />

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
            {table}
        </div>
    )
}
