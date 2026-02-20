// import { ArtistStat } from "../types";
// import { timeConversion } from "../utils";
import { JSX, useLayoutEffect, useRef, useState } from "react";
import classes from "./RoundedStepChart.module.scss";
import { dateToHuman, getPalette } from "../utils";

export interface GraphSerie {
    id: number;
    label: string;
    points: number[];
    dataToString: Function;
}

export interface GraphData {
    normalize: boolean,
    labels: String[];     // x axis
    series: GraphSerie[]; // y axis
}

export function RoundedStepChart({ data }: { data: GraphData }) {

    const svgRef = useRef<HTMLDivElement | null>(null)

    // const [historyData, sethistoryData] = useState<SongHistoryStats[]>([])
    // const [songCacheData, setSongCacheData] = useState<SongsMap>({})
    const [size, setSize] = useState<{ width: number; height: number } | null>(null)
    // const [cumulative, setCumulative] = useState(true)
    // const [normalize, setNormalize] = useState(false)
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

    let createPoint = (v: number, max: number, i: number, serie: GraphSerie, yunit: number, color: string, date: String) => {
        let el = <circle cx={i*xspace} cy={(max-v)*yunit} r="6" stroke={color} fill="transparent" strokeWidth="2">
            <title>(id {serie.id}) {serie.label} ({serie.dataToString(v)}, {dateToHuman(date as string)})</title>
        </circle>
        return el
    }

    let colors = getPalette(data.series.length)
    data.series.forEach((serie: GraphSerie) => {
        let color = colors[serie.id % colors.length]
        // let wasShowingRightCircle = true

        let previous_value: number | null = null
        let value = serie.points[0]
        let last_drawn = -1

        for (let i = 0; i < serie.points.length; i++) {

            let next_value = serie.points[i+1]

            if (!value) {
                value = next_value
                last_drawn = -1
                continue
            }
            if (value === previous_value && value === next_value) {
                value = next_value
                continue
            }

            if (last_drawn > -1) {
                if (last_drawn < i-1) {
                    let max0 = (data.normalize ? dates[i].max : all_max)*1.01
                    let yunit0 = yspace / max0

                    let max1 = (data.normalize ? dates[i+1].max : all_max)*1.01
                    let yunit1 = yspace / max1

                    let x1 = (last_drawn+0.5)*xspace + 6
                    let y1 = (max0-previous_value!)*yunit0
                    let x2 = (i+0.5)*xspace - 6
                    let y2 = (max1-value)*yunit1
                    let el = <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} fill="transparent" strokeWidth="2"></line>
                    flows.push(el)
                } else if (previous_value && value) {
                    let max0 = (data.normalize ? dates[i].max : all_max)*1.01
                    let yunit0 = yspace / max0

                    let max1 = (data.normalize ? dates[i+1].max : all_max)*1.01
                    let yunit1 = yspace / max1

                    let x1 = (i-0.5)*xspace + 6
                    let y1 = (max0-previous_value!)*yunit0
                    let c1x = (i)*xspace
                    let c1y = (max0-previous_value!)*yunit0
                    let c2x = (i)*xspace
                    let c2y = (max1-value)*yunit1
                    let x2 = (i+0.5)*xspace - 6
                    let y2 = (max1-value)*yunit1
                    let el = <path d={`M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`} stroke={color} fill="transparent" strokeWidth="2" />
                    flows.push(el)
                }
            }

            if (value && value !== previous_value || next_value !== value) {
                let date = dates[i]
                let max = (data.normalize ? date.max : all_max)*1.01
                let yunit = yspace / max

                let el = createPoint(value, max, i+0.5, serie, yunit, color, date.date)
                flows.push(el)
                last_drawn = i
            }

            previous_value = value
            value = next_value

        }
    })
    // console.log('size', size)
    let svg = <svg viewBox={`0 0 ${size?.width || 1}, ${size?.height || 1}`}>
        {flows}
    </svg>

    return (
        <div className={classes.svgContainer} ref={svgRef}>
            {svg}
        </div>
    )
}
