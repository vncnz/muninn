import classes from "./StatsGeneric.module.scss";
import { useEffect, useState } from "react";

type StatsGenericProps<T> = {
  loadFn: (from: number) => Promise<T[]>
  Row: React.ComponentType<{ item: T; max: number }>
  getValue: (item: T) => number
  refreshLabel?: string
}

// T is ArtistStat, for example
// Row is StatsArtistRow
// getValue computes max
export function StatsGeneric<T>({
  loadFn,
  Row,
  getValue,
  refreshLabel = "Refresh"
}: StatsGenericProps<T>) {
    const forever = -1000000
    const [stats, setStats] = useState<T[]>([])
    const [period, setPeriod] = useState(forever)

    const load = async () => {
        const s = await loadFn(period)
        setStats(s)
    }

    useEffect(() => { load(); }, [period, loadFn]);

    // let full = artistStats.reduce((acc: number, v: any) => acc + v.listened_time, 0)
    let max = stats.reduce((acc: number, v: T) => Math.max(acc, getValue(v)), 0)

    return (
        <div className={classes.artistStats}>
            <div className={classes.controls}>
                <span>
                    <a onClick={load}>&#8635; {refreshLabel}</a>
                </span>
                <span>
                    <a onClick={() => setPeriod(0)} className={classes.trSelector + (period === 0 ? (' '+classes.trActive) : '')}>Today</a>
                    <a onClick={() => setPeriod(-6)} className={classes.trSelector + (period === -6 ? (' '+classes.trActive) : '')}>Last 7d</a>
                    <a onClick={() => setPeriod(-30)} className={classes.trSelector + (period === -30 ? (' '+classes.trActive) : '')}>Last 30d</a>
                    <a onClick={() => setPeriod(forever)} className={classes.trSelector + (period === forever ? (' '+classes.trActive) : '')}>Forever</a>
                </span>
            </div>
            <div className={classes.lst}>
                {stats.map((item, i) =>
                    <Row key={i} item={item} max={max} />
                )}
            </div>
        </div>
    )
}
