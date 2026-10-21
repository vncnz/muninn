import { useEffect, useState } from "react";
import { ArtistHistoryBuckets, ArtistHistoryStats, BucketPoint, HeatmapRow, MultiColLabel } from "../types";
import classes from "./ArtistsHistoryHeatmap.module.scss";
import { invoke } from "@tauri-apps/api/core";
import { dateConversion, timeConversion, timeConversionDetailed } from "../utils";
import { GraphSerie, HeatmapChart } from "../HeatmapChart/HeatmapChart";

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faAnglesLeft, faAngleLeft, faAngleRight, faAnglesRight } from '@fortawesome/free-solid-svg-icons'
import { ChartRangeFilter, RangeFilter, RangeSettings } from "../ChartRangeFilter/ChartRangeFilter";

type SerieMap = Record<string, GraphSerie>

export function ArtistsHistoryHeatmap() {

    const [historyData, sethistoryData] = useState<ArtistHistoryStats[]>([])
    const [heatmapData, setHeatmapData] = useState<ArtistHistoryBuckets[]>([])
    const [cumulative, setCumulative] = useState(true)
    const [limit, setLimit] = useState(8)
    const [groupingDays, setGroupingDays] = useState(7)
    const [buckets, setBuckets] = useState(12)
    const [range, setRange] = useState<RangeFilter>({ from: -14, to: 0 })
    const [firstDate, setFirstDate] = useState<number>(0)
    
    const updateGroupingDays = (e: { target: { value: any; } }) => {
        // console.log('updateGroupingDays', e)
        let num = parseInt(e.target.value)
        if (num > 0) setGroupingDays(num)
    }
    const updateBuckets = (e: { target: { value: any; } }) => {
        // console.log('updateGroupingDays', e)
        let num = parseInt(e.target.value)
        if (num > 0) setBuckets(num)
    }
    const updateLimit = (e: { target: { value: any; } }) => {
        // console.log('updateLimit', e)
        let num = parseInt(e.target.value)
        if (num > 7) setLimit(num)
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

        console.log("range", range)
        let test = await (invoke("get_artists_heatmap", { to: range.to, totalBuckets: buckets, limit, step: groupingDays, cumulative }) as Promise<ArtistHistoryBuckets[]>)
        console.log("test heatmap", test)
        setHeatmapData(test)
    }
    useEffect(() => { load() }, [groupingDays, limit, range, buckets])

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

    let data: HeatmapRow[] = heatmapData.map((artist: ArtistHistoryBuckets) => {
        let points = artist.points.map((p: BucketPoint) => {
            let v = cumulative ? p.cumulative_time : p.point_time
            let from = dateConversion(p.date_start, 0)
            let to = dateConversion(p.date_end, 0)
            let humanTime = timeConversionDetailed(v)
            let tooltip = `${humanTime} between ${from} and ${to}`
            return {
                v,
                label: humanTime,
                tooltip
            }
        })
        return {
            id: artist.id,
            label: artist.name,
            points
        } as HeatmapRow
    })
    /* data.sort((a,b) => {
        // return b.points.at(-1).v - a.points.at(-1).v
        return b.points.at(0).v - a.points.at(0).v
    }) */

    let last = ""
    let legend: MultiColLabel[] = []
    if (heatmapData?.length) {
        heatmapData[0].points.forEach(p => {
            let leg = new Date(p.date_start).toLocaleDateString("en-US", {
                month: 'short'
            })
            if (leg != last) {
                legend.push({
                    width: 1,
                    label: leg
                })
                last = leg
            } else {
                legend[legend.length - 1].width += 1
            }
        })
    }

    /* let rangeFilterSettings: RangeSettings = {
        default: range,
        min: firstDate,
        max: 0,
        rangeCallback: (settings: RangeFilter) => {
            // console.log('settings', settings)
            setRange(settings)
        }
    } */

    return (
        <div className={classes.chart}>
            <div className={classes.controls}>
                <label>
                    <span>Cumulate</span><input type="checkbox" name="cumulative" checked={cumulative} onChange={() => setCumulative(!cumulative)} />
                </label>
                <label>Bucket size
                    <input 
                        type="number" 
                        name="groupingDays" 
                        value={groupingDays} 
                        onChange={updateGroupingDays}
                    />
                </label>
                <label>Buckets
                    <input 
                        type="number" 
                        name="buckets" 
                        value={buckets} 
                        onChange={updateBuckets}
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
            <HeatmapChart data={data} legend={legend} />
            {/*<ChartRangeFilter settings={rangeFilterSettings} />*/}
        </div>
    )
}
