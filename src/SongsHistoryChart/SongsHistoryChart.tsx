import { useEffect, useState } from "react";
import { SongHistoryStats, SongInfo } from "../types";
import classes from "./SongsHistoryChart.module.scss";
import { invoke } from "@tauri-apps/api/core";
import { artistsToString, timeConversion } from "../utils";
import { GraphData, GraphSerie, RoundedStepChart } from "../RoundedStepChart/RoundedStepChart";

type SongsMap = Record<string, SongInfo>
type SerieMap = Record<string, GraphSerie>

export function SongsHistoryChart() {

    const [historyData, sethistoryData] = useState<SongHistoryStats[]>([])
    const [songCacheData, setSongCacheData] = useState<SongsMap>({})
    const [cumulative, setCumulative] = useState(true)
    const [normalize, setNormalize] = useState(false)
    const [limit, setLimit] = useState(10)
    const [groupingDays, setGroupingDays] = useState(1)

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

    const load = async () => {
        let method = cumulative ? "get_songs_history_cumulative" : "get_songs_history"
        let res = await (invoke(method, { from: -8, to: 0, limit, step: groupingDays }) as Promise<SongHistoryStats[]>)
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
    useEffect(() => { load() }, [cumulative, groupingDays, limit])
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
    console.log('new structure', data)

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
        </div>
    )
}
