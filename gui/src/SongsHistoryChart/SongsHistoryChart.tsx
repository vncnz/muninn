import { useEffect, useState } from "react";
import { SongHistoryStats, SongInfo } from "../types";
import classes from "./SongsHistoryChart.module.scss";
import { invoke } from "@tauri-apps/api/core";
import { artistsToString, timeConversion } from "../utils";
import { GraphData, GraphSerie, RoundedStepChart } from "../RoundedStepChart/RoundedStepChart";
import { ChartRangeFilter, RangeFilter, RangeSettings } from "../ChartRangeFilter/ChartRangeFilter";

type SongsMap = Record<string, SongInfo>
type SerieMap = Record<string, GraphSerie>

export function SongsHistoryChart() {

    const [historyData, sethistoryData] = useState<SongHistoryStats[]>([])
    const [songCacheData, setSongCacheData] = useState<SongsMap>({})
    const [cumulative, setCumulative] = useState(true)
    const [normalize, setNormalize] = useState(false)
    const [limit, setLimit] = useState(10)
    const [groupingDays, setGroupingDays] = useState(1)
    const [range, setRange] = useState<RangeFilter>({ from: -14, to: 0 })
    const [firstDate, setFirstDate] = useState<number>(0)

    const updateGroupingDays = (e: { target: { value: any; } }) => {
        console.log('updateGroupingDays', e)
        let num = parseInt(e.target.value)
        if (num > 0) setGroupingDays(num)
    }
    const updateLimit = (e: { target: { value: any; } }) => {
        console.log('updateLimit', e)
        let num = parseInt(e.target.value)
        if (num > 9) setLimit(num)
    }

    const first = async () => {
        let res = await (invoke('get_first_date') as Promise<string>)
        let days = Math.ceil((new Date().getTime() - new Date(res).getTime()) / (1000 * 60 * 60 * 24))
        setFirstDate(-days)
        // console.log('first date', res, -days)
    }
    useEffect(() => { first() }, [])

    const load = async () => {
        let method = cumulative ? "get_songs_history_cumulative" : "get_songs_history"
        let res = await (invoke(method, { from: range.from, to: range.to, limit, step: groupingDays }) as Promise<SongHistoryStats[]>)
        console.log(method, res)
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
    useEffect(() => { load() }, [cumulative, groupingDays, limit, range])
    useEffect(() => { loadSongsData() }, [historyData])

    let uniqueDates = [...new Set(historyData.map(el => el.date))]
    uniqueDates.sort() // Already sorted in database?
    let series: SerieMap = {}
    historyData.forEach((v: SongHistoryStats) => {
        if (!series[v.songid]) series[v.songid] = {
            dataToString: timeConversion,
            id: v.songid,
            label: songCacheData[v.songid] ? `${songCacheData[v.songid]?.title} - ${artistsToString(songCacheData[v.songid]?.artists)}` : 'Loading...',
            points: new Array(uniqueDates.length).fill(null)
        }
        let idx = uniqueDates.indexOf(v.date)
        series[v.songid].points[idx] = v.listened_time
    })
    let data: GraphData = {
        normalize,
        labels: uniqueDates,
        series: Object.values(series)
    }
    // console.log('new structure', data)

    let rangeFilterSettings: RangeSettings = {
        default: range,
        min: firstDate,
        max: 0,
        rangeCallback: (settings: RangeFilter) => {
            // console.log('settings', settings)
            setRange(settings)
        }
    }

    return (
        <div className={classes.chart}>
            <div className={classes.controls}>
                <label>
                    <span>Cumulate</span><input type="checkbox" name="cumulative" checked={cumulative} onChange={() => setCumulative(!cumulative)} />
                </label>
                <label>
                    <span>Normalize</span><input type="checkbox" name="normalize" checked={normalize} onChange={() => setNormalize(!normalize)} />
                </label>
                <label>Bucket size
                    <input 
                        type="number" 
                        name="groupingDays" 
                        value={groupingDays} 
                        onChange={updateGroupingDays}
                    />
                </label>
                <label>Limit
                    <input 
                        type="number" 
                        name="limit" 
                        value={limit} 
                        onChange={updateLimit}
                    />
                </label>
            </div>
            <RoundedStepChart data={data} />
            <ChartRangeFilter settings={rangeFilterSettings} />
        </div>
    )
}
