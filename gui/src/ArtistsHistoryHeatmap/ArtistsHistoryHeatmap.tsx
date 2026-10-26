import { useEffect, useState } from "react";
import { ArtistHistoryBuckets, BucketPoint, HeatmapRow, MultiColLabel } from "../types";
import classes from "./ArtistsHistoryHeatmap.module.scss";
import { invoke } from "@tauri-apps/api/core";
import { calculateDateSpanMonths, dateConversion, timeConversionDetailed } from "../utils";
import { HeatmapChart } from "../HeatmapChart/HeatmapChart";

export function ArtistsHistoryHeatmap() {

    // const [historyData, sethistoryData] = useState<ArtistHistoryStats[]>([])
    const [heatmapData, setHeatmapData] = useState<ArtistHistoryBuckets[]>([])
    const [cumulative, setCumulative] = useState(true)
    const [limit, setLimit] = useState(8)
    const [groupingDays, setGroupingDays] = useState(7)
    const [buckets, setBuckets] = useState(12)
    const [firstDate, setFirstDate] = useState<number>(0)
    const rangeto = 0
    
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
        let test = await (invoke("get_artists_heatmap", { to: rangeto, totalBuckets: buckets, limit, step: groupingDays }) as Promise<ArtistHistoryBuckets[]>)
        console.log("test heatmap", test)
        setHeatmapData(test)
    }
    useEffect(() => { load() }, [groupingDays, limit, rangeto, buckets])

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

    let legend: MultiColLabel[] = []
    let months = calculateDateSpanMonths(rangeto - buckets * groupingDays, rangeto).reverse()
    let validRatio =  firstDate / (-buckets * groupingDays)

    months.forEach(m => {
        legend.push({
            width: m.percentage,
            label: m.monthName.substring(0,3)
        })
    })

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
            <HeatmapChart data={data} legend={legend} vline={validRatio} />
        </div>
    )
}
