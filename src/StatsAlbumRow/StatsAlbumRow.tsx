import { AlbumStat } from "../types";
import { timeConversion } from "../utils";
import classes from "./StatsAlbumRow.module.scss";


export function StatsAlbumRow({ album, max, idd }: { album: AlbumStat, max: number, idd: number }) {
    console.log('artists', album.artists)
    return (
        <div className={classes.albumstatrow + ' id-' + idd}>
            <div className={classes.time}>
                <div className={classes.progressBar}>
                    <div style={{ height: `${((album.listened_time  as number)/ max)*100}%` }}></div>
                </div>
                <div className={classes.listened}>{timeConversion(album.listened_time)}</div>
            </div>
            <div className={classes.title}>{album.name}</div>
            <div className={classes.artist}>{album.artists}</div>
        </div>
    )
}
