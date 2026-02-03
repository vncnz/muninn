// import { ArtistStat } from "../types";
// import { timeConversion } from "../utils";
import { JSX, useEffect, useLayoutEffect, useRef, useState } from "react";
import classes from "./RoundedStepChart.module.scss";
import { getPalette } from "../utils";

interface GraphSerie {
    id: number;
    label: string;
    points: number[];
    dataToString: Function;
}

interface GraphData {
  labels: string[];     // x axis
  series: GraphSerie[]; // y axis
}

export function RoundedStepChart({ data }: { data: GraphData }) {

    const svgRef = useRef<HTMLDivElement | null>(null)

    // const [historyData, sethistoryData] = useState<SongHistoryStats[]>([])
    // const [songCacheData, setSongCacheData] = useState<SongsMap>({})
    const [size, setSize] = useState<{ width: number; height: number } | null>(null)
    // const [cumulative, setCumulative] = useState(true)
    const [normalize, setNormalize] = useState(false)
    // const [groupingDays, setGroupingDays] = useState(1)

    /* const updateGroupingDays = (e: { target: { value: any; } }) => {
        console.log('updateGroupingDays', e)
        let num = parseInt(e.target.value)
        if (num > 0) setGroupingDays(num)
    } */

    useLayoutEffect(() => {
        if (!svgRef.current) return

        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            setSize({ width, height })
        })

        observer.observe(svgRef.current)
        return () => observer.disconnect()
    }, [])

    let dates: {date: String, max: number}[] = data.labels.map(lbl => { return { date: lbl, max: 0 } })
    data.series.forEach((serie: GraphSerie) => {
        serie.points.forEach((v: number, idx: number) => {
            dates[idx].max = Math.max(dates[idx].max, v)
        })
    })
    let all_max = Math.max(...dates.map(el => el.max))

    let flows: JSX.Element[] = []

    let xspace = (size?.width || 100) / dates.length
    let yspace = size?.height || 100

    let colors = getPalette(data.series.length)
    data.series.forEach((serie: GraphSerie, idx: number) => {
        let color = colors[serie.id % colors.length]
        for (let i = 0; i < serie.points.length - 1; i++) {
            let date0 = dates[i]
            let date1 = dates[i+1]
            let v0 = serie.points[i]
            let v1 = serie.points[i+1]
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
            } */
           if (v1) {
                let el = <circle cx={(i+1.5)*xspace} cy={(max1-v1)*yunit1} r="6" stroke={color} fill="transparent" strokeWidth="2">
                    <title>Song {serie.id}: {serie.dataToString(v1)}</title>
                </circle>
                flows.push(el)
            }
            if (v0 && i === 0) {
                let el = <circle cx={(i+0.5)*xspace} cy={(max0-v0)*yunit0} r="6" stroke={color} fill="transparent" strokeWidth="2">
                    <title>Song {serie.id}: {serie.dataToString(v0)}</title>
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
        <div className={classes.chart}>
            <div className={classes.controls}>
                <label>
                    <span>Normalize</span><input type="checkbox" name="normalize" checked={normalize} onChange={() => setNormalize(!normalize)} />
                </label>
            </div>
            <div className={classes.svgContainer} ref={svgRef}>
                {svg}
            </div>
        </div>
    )
}
