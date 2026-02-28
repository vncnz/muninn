import { ArtistStat } from "../types";
import { timeConversion } from "../utils";
import classes from "./StatsArtistRow.module.scss";


export function StatsArtistRow({ artist, max, idd }: { artist: ArtistStat, max: number, idd: number }) {

    return (
        <div className={classes.artiststatrow + ' id-' + idd}>
            <div className={classes.time}>
                <div className={classes.progressBar}>
                    <div style={{ height: `${((artist.listened_time  as number)/ max)*100}%` }}></div>
                </div>
                <div className={classes.listened}>{timeConversion(artist.listened_time)}</div>
            </div>
            <div className={classes.title}>{artist.name}</div>
        </div>
    )
}
