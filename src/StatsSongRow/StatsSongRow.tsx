import { songStatTable } from "../types";
import { artistsToString, timeConversion } from "../utils";
// import { artistsToString, timeConversion } from "../utils";
import classes from "./StatsSongRow.module.scss";
// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";


export function StatsSongRow({ song, max }: { song: songStatTable, max: number }) {
    // const [songStats, setSongStats] = useState([] as SongInfo[]);
    
    /*let columns = [
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
    ] as Column<songStatTable>[]*/

    return (
        <div className={classes.songstatrow}>
            <div className={classes.time}>
                <div className={classes.progressBar}>
                    <div style={{ height: `${((song.listened_time  as number)/ max)*100}%` }}></div>
                </div>
                <div className={classes.listened}>{timeConversion(song.listened_time)} / {timeConversion(song.length)}</div>
            </div>
            <div className={classes.title}>{song.title}</div>
            <div className={classes.artist_album}>{artistsToString(song.artists)} / {song.album}</div>
        </div>
    )
}
