import { SongPlaying } from "../types";
import { artistsToString, timeToHuman, toPercent } from "../utils";
import classes from "./Playing.module.scss";
// import { useState, useEffect } from "react";


export function Playing({ playing }: {playing: SongPlaying}) {
    let artist = artistsToString(playing.metadata.artists)
    let progressRatio = playing.position/playing.metadata.length
    let songEl = playing.metadata.title ? 
        <div>
            <div>Title: {playing.metadata.title}</div>
            <div>Artist: {artist}</div>
            <div>Album: {playing.metadata.album}</div>
        </div>
        :
        <div>No playing</div>

        let progress = <div className={classes.progressBar}>
            <div style={{ width: `${progressRatio*100}%` }}></div>
        </div>

    return (
        <div className={classes.playing}>
            {songEl}
            <div className={classes.progressContainer}>
                {progress}
                { playing.metadata.length > 0 && <div>Time: {timeToHuman(playing.position)} / {timeToHuman(playing.metadata.length)} ({toPercent(progressRatio)})</div> }
            </div>
        </div>
    )
}
