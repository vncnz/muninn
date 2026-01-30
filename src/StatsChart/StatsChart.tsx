// import { ArtistStat } from "../types";
// import { timeConversion } from "../utils";
import { JSX, useEffect } from "react";
import { SongHistoryStats, StatsForChart } from "../types";
import classes from "./StatsChart.module.scss";
import { invoke } from "@tauri-apps/api/core";

export function StatsChart() {

    const load = async () => {
        let res = await (invoke("get_songs_history", { from: -5, to: 0, limit: 10, step: 1 }) as Promise<SongHistoryStats[]>)
        console.log('get_songs_history', res)
    }
    useEffect(() => { load() }, [])

    let lst: StatsForChart[] = [{
        date: '2026-01-20',
        ids: [1, 2, 3, 4, 5]
    }, {
        date: '2026-01-21',
        ids: [1, 3, 2, 4, 5]
    }, {
        date: '2026-01-22',
        ids: [1, 3, 4, 2, 6]
    }, {
        date: '2026-01-23',
        ids: [3, 4, 2, 1, 5]
    }]
    let all_idx: number[] = []
    lst.forEach(period => {
        period.ids.forEach((songid: number) => {
            if (all_idx.indexOf(songid) < 0) all_idx.push(songid)
        })
    })

    /* let flows = lst.map((day, idx) => {
        return <path d={`M 10 10 C 20 10, 30 40, 40 40`} stroke="red" />
    }) */
    let flows: JSX.Element[] = []

    let xspace = 100
    let yspace = 50
    let colors = ['#f7737a', '#850dbf', '#c2fc37', '#d92d1f', '#49feff', '#11bb44', '#948f41']

    all_idx.forEach((songid: number) => {
        for (let i = 0; i < lst.length - 1; i++) {
            let p_from = lst[i]
            let p_to = lst[i+1]
            let idx_from = p_from.ids.indexOf(songid)
            let idx_to = p_to.ids.indexOf(songid)
            console.log(`songid:${songid} idx:${idx_from}->idx:${idx_to}`)
            if (idx_from > -1 && idx_to > -1) {
                let x1 = i*xspace
                let y1 = idx_from*yspace
                let c1x = (i+0.5)*xspace
                let c1y = idx_from*yspace
                let c2x = (i+0.5)*xspace
                let c2y = idx_to*yspace
                let x2 = (i+1)*xspace
                let y2 = idx_to*yspace
                let el = <path d={`M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`} stroke={colors[songid]} fill="transparent" strokeWidth="2" />
                flows.push(el)
            } else if (idx_from > -1) {
                let el = <circle cx={i*xspace} cy={idx_from*yspace} r="5" stroke={colors[songid]} fill="transparent" strokeWidth="2" />
                flows.push(el)
            } else if (idx_to > -1) {
                let el = <circle cx={(i+1)*xspace} cy={idx_to*yspace} r="5" stroke={colors[songid]} fill="transparent" strokeWidth="2" />
                flows.push(el)
            }
        }
    })

    let svg = <svg viewBox={`0 0 ${lst.length * xspace}, ${all_idx.length * yspace}`}>
        {flows}
    </svg>

    return (
        <div className={classes.chart}>
            {svg}
        </div>
    )
}
