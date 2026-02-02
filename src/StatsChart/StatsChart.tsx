// import { ArtistStat } from "../types";
// import { timeConversion } from "../utils";
import { JSX, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SongHistoryStats, SongInfo } from "../types";
import classes from "./StatsChart.module.scss";
import { invoke } from "@tauri-apps/api/core";
import { artistsToString, getPalette, timeConversion, timeToHuman } from "../utils";

type SongsMap = Record<string, SongInfo>

export function StatsChart() {

    const svgRef = useRef<HTMLDivElement | null>(null)

    const [historyData, sethistoryData] = useState<SongHistoryStats[]>([])
    const [songCacheData, setSongCacheData] = useState<SongsMap>({})
    const [size, setSize] = useState<{ width: number; height: number } | null>(null)

    useLayoutEffect(() => {
        if (!svgRef.current) return

        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            setSize({ width, height })
        })

        observer.observe(svgRef.current)
        return () => observer.disconnect()
    }, [])

    const load = async () => {
        let res = await (invoke("get_songs_history_cumulative", { from: -8, to: 0, limit: 12, step: 1 }) as Promise<SongHistoryStats[]>)
        console.log('get_songs_history_cumulative', res)
        sethistoryData(res)
    }
    const loadSongsData = async () => {
        if (historyData.length) {
            let res = await (invoke("get_songs_by_id", { idx: historyData.map(v => v.songid) }) as Promise<SongInfo[]>)
            let map: SongsMap = {}
            res.forEach((song: SongInfo) => { map[song.id!] = song })
            console.log('get_songs_by_id', res)
            setSongCacheData(map)
        } else {
            console.warn('No historyData')
        }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { loadSongsData() }, [historyData])

    let normalize = false
    let all_idx: number[] = []
    let dates: {date: String, max: number}[] = []
    let all_max = 0
    historyData.forEach((point: SongHistoryStats) => {
        if (all_idx.indexOf(point.songid) < 0) all_idx.push(point.songid)
        
        let el = dates.find(dt => dt.date === point.date)
        if (!el) {
            el = {date: point.date, max: point.listened_time}
            dates.push(el)
        } else el.max = Math.max(el.max, point.listened_time)

        all_max = Math.max(all_max, point.listened_time)
    })

    let flows: JSX.Element[] = []

    let xspace = (size?.width || 100) / dates.length
    let yspace = size?.height || 100
    // let colors = ['#f7737a', '#850dbf', '#c2fc37', '#d92d1f', '#49feff', '#11bb44', '#948f41']

    let debug: { date: String; lst: String[]; }[] = []
    dates.forEach((date: any) => {
        let lst = historyData.filter(point => point.date === date)
        lst.sort((a,b) => a.listened_time>b.listened_time ? 1 : -1)
        debug.push({
            date,
            lst: lst.map(el => `${el.songid} (${el.listened_time})`)
        })
    })
    console.log(debug)

    let colors = getPalette(all_idx.length)
    all_idx.sort()
    all_idx.forEach((songid: number, idx: number) => {
        let color = colors[idx % colors.length]
        let lst = historyData.filter((point: SongHistoryStats) => point.songid === songid)
        // console.log(`song:${songid} (color ${color})`, lst)
        for (let i = 0; i < dates.length - 1; i++) {
            let date0 = dates[i]
            let date1 = dates[i+1]
            let v0 = lst.find(point => point.date === date0.date)?.listened_time
            let v1 = lst.find(point => point.date === date1.date)?.listened_time
            // console.log(`songid:${songid} values ${v0} (${date0.date}) -> ${v1} (${date1.date})`)
            let max0 = normalize ? date0.max : all_max
            let max1 = normalize ? date1.max : all_max
            let yunit0 = yspace / max0
            let yunit1 = yspace / max1
            if (v0 && v1) {
                let x1 = (i+0.5)*xspace
                let y1 = (max0-v0)*yunit0
                let c1x = (i+1)*xspace
                let c1y = (max0-v0)*yunit0
                let c2x = (i+1)*xspace
                let c2y = (max1-v1)*yunit1
                let x2 = (i+1.5)*xspace
                let y2 = (max1-v1)*yunit1
                let el = <path d={`M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`} stroke={color} fill="transparent" strokeWidth="2" />
                flows.push(el)
            } /* else if (v0) {
                let el = <circle cx={i*xspace} cy={(max0-v0)*yunit0} r="6" stroke={color} fill="transparent" strokeWidth="2"><title>Test</title></circle>
                flows.push(el)
            } */ else if (v1) {
                let el = <circle cx={(i+1.5)*xspace} cy={(max1-v1)*yunit1} r="6" stroke={color} fill="transparent" strokeWidth="2">
                    <title>Song {songid}</title>
                </circle>
                flows.push(el)
            }
            if (v0) {
                let el = <circle cx={(i+0.5)*xspace} cy={(max0-v0)*yunit0} r="6" stroke={color} fill="transparent" strokeWidth="2">
                    <title>Song {songid}: {songCacheData[songid]?.title} - {artistsToString(songCacheData[songid]?.artists)} ({timeConversion(v0)})</title>
                </circle>
                flows.push(el)
            }
        }
    })
    console.log('size', size)
    let svg = <svg viewBox={`0 0 ${size?.width || 1}, ${size?.height || 1}`}>
        {flows}
    </svg>

    return (
        <div className={classes.chart} ref={svgRef}>
            {svg}
        </div>
    )
}
