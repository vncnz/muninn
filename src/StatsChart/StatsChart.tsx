// import { ArtistStat } from "../types";
// import { timeConversion } from "../utils";
import { JSX, useEffect, useState } from "react";
import { SongHistoryStats, StatsForChart } from "../types";
import classes from "./StatsChart.module.scss";
import { invoke } from "@tauri-apps/api/core";

export function StatsChart() {

    const [historyData, sethistoryData] = useState<SongHistoryStats[]>([])

    const load = async () => {
        let res = await (invoke("get_songs_history", { from: -8, to: 0, limit: 10, step: 1 }) as Promise<SongHistoryStats[]>)
        console.log('get_songs_history', res)
        sethistoryData(res)
    }
    useEffect(() => { load() }, [])

    let all_idx: number[] = []
    let dates: String[] = []
    let max_value: number = 0
    historyData.forEach((point: SongHistoryStats) => {
        if (all_idx.indexOf(point.songid) < 0) all_idx.push(point.songid)
        if (dates.indexOf(point.date) < 0) dates.push(point.date)
        max_value = Math.max(max_value, point.listened_time)
    })

    let flows: JSX.Element[] = []

    let xspace = 100
    let yspace = 200
    let yunit = yspace / max_value
    let colors = ['#f7737a', '#850dbf', '#c2fc37', '#d92d1f', '#49feff', '#11bb44', '#948f41']

    let debug: { date: String; lst: String[]; }[] = []
    dates.forEach((date: String) => {
        let lst = historyData.filter(point => point.date === date)
        lst.sort((a,b) => a.listened_time>b.listened_time ? 1 : -1)
        debug.push({
            date,
            lst: lst.map(el => `${el.songid} (${el.listened_time})`)
        })
    })
    console.log(debug)

    all_idx.forEach((songid: number, idx: number) => {
        let color = colors[idx % all_idx.length]
        let lst = historyData.filter((point: SongHistoryStats) => point.songid === songid)
        console.log(`song:${songid}`, lst)
        for (let i = 0; i < dates.length - 1; i++) {
            let date0 = dates[i]
            let date1 = dates[i+1]
            let v0 = lst.find(point => point.date === date0)?.listened_time
            let v1 = lst.find(point => point.date === date1)?.listened_time
            console.log(`songid:${songid} v0:${v0}->v1:${v1}`)
            if (v0 && v1) {
                let x1 = i*xspace
                let y1 = (max_value-v0)*yunit
                let c1x = (i+0.5)*xspace
                let c1y = (max_value-v0)*yunit
                let c2x = (i+0.5)*xspace
                let c2y = (max_value-v1)*yunit
                let x2 = (i+1)*xspace
                let y2 = (max_value-v1)*yunit
                let el = <path d={`M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`} stroke={color} fill="transparent" strokeWidth="2" />
                flows.push(el)
            } else if (v0) {
                let el = <circle cx={i*xspace} cy={(max_value-v0)*yunit} r="2" stroke={color} fill="transparent" strokeWidth="2" />
                flows.push(el)
            } else if (v1) {
                let el = <circle cx={(i+1)*xspace} cy={(max_value-v1)*yunit} r="2" stroke={color} fill="transparent" strokeWidth="2" />
                flows.push(el)
            }
        }
    })

    let svg = <svg viewBox={`0 0 ${dates.length * xspace}, ${all_idx.length * yspace}`}>
        {flows}
    </svg>

    return (
        <div className={classes.chart}>
            {svg}
        </div>
    )
}
