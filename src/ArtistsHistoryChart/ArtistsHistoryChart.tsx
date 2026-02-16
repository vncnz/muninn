import { useEffect, useState } from "react";
import { ArtistHistoryStats, SongHistoryStats, SongInfo } from "../types";
import classes from "./ArtistsHistoryChart.module.scss";
import { invoke } from "@tauri-apps/api/core";
import { artistsToString, timeConversion } from "../utils";
import { GraphData, GraphSerie, RoundedStepChart } from "../RoundedStepChart/RoundedStepChart";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAnglesLeft, faAngleLeft, faAngleRight, faAnglesRight } from '@fortawesome/free-solid-svg-icons'
import { ChartRangeFilter, RangeFilter, RangeSettings } from "../ChartRangeFilter/ChartRangeFilter";

type SongsMap = Record<string, SongInfo>
type SerieMap = Record<string, GraphSerie>

export function ArtistsHistoryChart() {

    const [historyData, sethistoryData] = useState<ArtistHistoryStats[]>([])
    const [cumulative, setCumulative] = useState(true)
    const [normalize, setNormalize] = useState(false)
    const [limit, setLimit] = useState(10)
    const [groupingDays, setGroupingDays] = useState(1)
    const [range, setRange] = useState<RangeFilter>({ from: -14, to: 0 })
    const [firstDate, setFirstDate] = useState<number>(0)
    
    const updateGroupingDays = (e: { target: { value: any; } }) => {
        // console.log('updateGroupingDays', e)
        let num = parseInt(e.target.value)
        if (num > 0) setGroupingDays(num)
    }
    const updateLimit = (e: { target: { value: any; } }) => {
        // console.log('updateLimit', e)
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
        let method = cumulative ? "get_artists_history_cumulative" : "get_artists_history"
        let res = await (invoke(method, { from: range.from, to: range.to, limit, step: groupingDays }) as Promise<ArtistHistoryStats[]>)
        // console.log(method, res)
        sethistoryData(res)
    }
    useEffect(() => { load() }, [cumulative, groupingDays, limit, range])

    let uniqueDates = [...new Set(historyData.map(el => el.date))]
    uniqueDates.sort() // Already sorted in database?
    let series: SerieMap = {}
    historyData.forEach((v: ArtistHistoryStats) => {
        if (!series[v.artistid]) series[v.artistid] = {
            dataToString: timeConversion,
            id: v.artistid,
            label: v.artistname,
            points: new Array(uniqueDates.length).fill(null)
        }
        let idx = uniqueDates.indexOf(v.date)
        series[v.artistid].points[idx] = v.listened_time
    })
    let data: GraphData = {
        normalize,
        labels: uniqueDates,
        series: Object.values(series)
    }
    // console.log('new structure', data)

    // let changeFrom = (diff: number) => { if (from+diff < to) setFrom(from+diff) }
    let tmp = new Date()
    tmp.setDate(tmp.getDate() + range.from)
    let fromDate = tmp.toDateString()

    // let changeTo = (diff: number) => { let newTo = Math.min(Math.max(from+1, to+diff), 0); if (newTo != to) setTo(newTo) }
    tmp = new Date()
    tmp.setDate(tmp.getDate() + range.to)
    let toDate = tmp.toDateString()

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
            <div className={classes.periodControl}>
                <div>
                    {fromDate}
                </div>
                <div>
                    {toDate}
                </div>
            </div>
            <ChartRangeFilter settings={rangeFilterSettings} />
        </div>
    )
}
