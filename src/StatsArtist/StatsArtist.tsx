import { ArtistStat } from "../types";
import { timeConversion } from "../utils";
import classes from "./StatsArtist.module.scss";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Column, VisualTable } from "../VisualTable/VisualTable";


export function StatsArtist () {
    const [artistStats, setArtistStats] = useState([] as ArtistStat[]);

    const load = async () => {
        let s = await invoke("get_top_artists", {}) as ArtistStat[]
        console.log('artist stats', s)
        setArtistStats(s)
    }

    useEffect(() => { load(); }, []);

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
          visualkey="listened_time"
          columns={columns}
          rows={artistStats}
        />

    return (
        <div className={classes.artistStats}>
            <div><a onClick={load}>&#8635; Refresh Artist Stats</a></div>
            {table}
        </div>
    )
}
