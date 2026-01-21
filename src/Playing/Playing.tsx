import { SongPlaying } from "../types";
import { artistsToString, timeToHuman, toPercent } from "../utils";
import classes from "./Playing.module.scss";
// import { useState, useEffect } from "react";


export function Playing({ playing }: {playing: SongPlaying}) {
    let artist = artistsToString(playing.metadata.artists)
    let songEl = playing.metadata.title ? 
        <div>
        <div>Title: {playing.metadata.title}</div>
        <div>Artist: {artist}</div>
        <div>Album: {playing.metadata.album}</div>
        { playing.metadata.length > 0 && <div>Time: {timeToHuman(playing.position)} / {timeToHuman(playing.metadata.length)} ({toPercent(playing.position/playing.metadata.length)})</div> }
        </div>
        :
        <div>No playing</div>

    return (
        <div className={classes.playing}>
            {songEl}
        </div>
    )
}
