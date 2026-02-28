import { songStatTable } from "../types";
import { artistsToString, timeConversion } from "../utils";
// import { artistsToString, timeConversion } from "../utils";
import classes from "./StatsSongRow.module.scss";
// import { useEffect, useState } from "react";
// import { invoke } from "@tauri-apps/api/core";


export function StatsSongRow({ song, max, idd }: { song: songStatTable, max: number, idd: any }) {

    return (
        <div className={classes.songstatrow + ' id-' + idd}>
            <div className={classes.time}>
                <div className={classes.progressBar}>
                    <div style={{ height: `${((song.listened_time  as number)/ max)*100}%` }}></div>
                </div>
                <div className={classes.listened}>{timeConversion(song.listened_time)}<span className={classes.duration}>&nbsp;/&nbsp;{timeConversion(song.length)}</span></div>
            </div>
            <div className={classes.title}>{song.title}</div>
            <div className={classes.artist_album}>
                <span className={classes.artist}>{artistsToString(song.artists)}</span><span className={classes.album}>&nbsp;/&nbsp;{song.album}</span></div>
        </div>
    )
}
