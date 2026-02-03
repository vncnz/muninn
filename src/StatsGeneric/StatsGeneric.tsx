import classes from "./StatsGeneric.module.scss";
import { useEffect, useState } from "react";

type StatsGenericProps<T> = {
  loadFn: (from: number, to: number, limit: number) => Promise<T[]>
  Row: React.ComponentType<{ item: T; max: number; idd: number }>
  getValue: (item: T) => number
  refreshLabel?: string
  highlightId?: number|undefined
}

// T is ArtistStat, for example
// Row is StatsArtistRow
// getValue computes max
export function StatsGeneric<T>({
  loadFn,
  Row,
  getValue,
  refreshLabel = "Refresh",
  highlightId = undefined
}: StatsGenericProps<T>) {
    const forever = -1000000
    const [stats, setStats] = useState<T[]>([])
    const [period, setPeriod] = useState(forever)
    const [topLimit, setTopLimit] = useState(25)

    const load = async () => {
        const s = await loadFn(period, 0, topLimit)
        setStats(s)
        console.log('updated stats', s)
    }

    useEffect(() => { load(); }, [period, topLimit]);

    const scrollToHighlight = () => {
        if (highlightId === undefined) return;
        // let rowEl = document.querySelector(`.row-id-${playingId}`);
        // let idx = stats.findIndex(el => el.id === highlightId)
        // if (idx > -1) {
        let rowEl = document.querySelector(`.id-${highlightId}`);
        rowEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // } else {
        //    console.log('Playing song not found in list', highlightId)
        // }
    }

    // let full = artistStats.reduce((acc: number, v: any) => acc + v.listened_time, 0)
    let max = stats.reduce((acc: number, v: T) => Math.max(acc, getValue(v)), 0)

    console.log('StatsGeneric updated')
    return (
        <div className={classes.artistStats}>
            <div className={classes.controls}>
                <span>
                    <a onClick={load}>&#8635; {refreshLabel}</a>
                    { highlightId ? <a onClick={scrollToHighlight}>&#9658; Scroll to current</a> : null }
                </span>
                <span>
                    <a onClick={() => setPeriod(0)} className={classes.trSelector + (period === 0 ? (' '+classes.trActive) : '')}>Today</a>
                    <a onClick={() => setPeriod(-6)} className={classes.trSelector + (period === -6 ? (' '+classes.trActive) : '')}>Last 7d</a>
                    <a onClick={() => setPeriod(-30)} className={classes.trSelector + (period === -30 ? (' '+classes.trActive) : '')}>Last 30d</a>
                    <a onClick={() => setPeriod(forever)} className={classes.trSelector + (period === forever ? (' '+classes.trActive) : '')}>Forever</a>
                </span>
                <span>
                    <a onClick={() => setTopLimit(10)} className={classes.trSelector + (topLimit === 10 ? (' '+classes.trActive) : '')}>Top10</a>
                    <a onClick={() => setTopLimit(25)} className={classes.trSelector + (topLimit === 25 ? (' '+classes.trActive) : '')}>Top25</a>
                    <a onClick={() => setTopLimit(50)} className={classes.trSelector + (topLimit === 50 ? (' '+classes.trActive) : '')}>Top50</a>
                    <a onClick={() => setTopLimit(100)} className={classes.trSelector + (topLimit === 100 ? (' '+classes.trActive) : '')}>Top100</a>
                </span>
            </div>
            <div className={classes.lst}>
                {stats.map((item, i) =>
                    <Row key={i} item={item} max={max} idd={i} />
                )}
            </div>
        </div>
    )
}
