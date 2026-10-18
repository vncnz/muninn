// import { ArtistStat } from "../types";
// import { timeConversion } from "../utils";
import { JSX, useLayoutEffect, useRef, useState } from "react";
import classes from "./HeatmapChart.module.scss";
import { dateConversion, dateToHuman, getPalette, timeConversion, timeConversionDetailed } from "../utils";

export interface GraphSerie {
    id: number;
    label: string;
    points: number[];
    dataToString: Function;
}

export interface GraphData {
    normalize: boolean,
    labels: string[];     // x axis
    series: GraphSerie[]; // y axis
}

export function HeatmapChart({ data }: { data: GraphData }) {

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
    let row_length = dates.length

    let flows: JSX.Element[] = []

    let xspace = (size?.width || 100) / dates.length
    let yspace = size?.height || 100

    let createPoint = (v: number, y: number, i: number, serie: GraphSerie, color: string, date: String) => {
        let el = <circle cx={i*xspace} cy={y*yspace} r="6" stroke={color} fill="transparent" strokeWidth="2">
            <title>(id {serie.id}) {serie.label} ({serie.dataToString(v)}, {dateToHuman(date as string)})</title>
        </circle>
        return el
    }
    let createLine = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        let el = <line x1={x1*xspace+5} y1={y1*yspace} x2={x2*xspace-5} y2={y2*yspace} stroke={color} fill="transparent" strokeWidth="2"></line>
        return el
    }
    let createBezier = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        let c1x = (x1+x2)/2
        let c1y = y1
        let c2x = (x1+x2)/2
        let c2y = y2
        let el = <path d={`M ${x1*xspace+5} ${y1*yspace} C ${c1x*xspace} ${c1y*yspace}, ${c2x*xspace} ${c2y*yspace}, ${x2*xspace-5} ${y2*yspace}`} stroke={color} fill="transparent" strokeWidth="2" />
        return el
    }

    console.log('data', data)
    let colors = getPalette(data.series.length)
    data.series.forEach((serie: GraphSerie) => {
        let color = colors[serie.id % colors.length]

        let ratios = serie.points.map((point: number|null, idx: number) => {
            if (point === null) return null
            let max = (data.normalize ? dates[idx].max : all_max)*1.01
            let num = point/max
            return Math.round((num + Number.EPSILON) * 100) / 100
        })

        let last_pointed_idx = -1
        ratios.forEach((rat: number|null, idx: number) => {
            if (rat !== null && (idx === 0 || rat !== ratios[idx-1] || rat !== ratios[idx+1])) {
                let el = createPoint(serie.points[idx], 1-rat, idx+0.5, serie, color, dates[idx].date)
                flows.push(el)
                if (last_pointed_idx > -1) {
                    if (rat === ratios[idx-1]) {
                        let line = createLine(last_pointed_idx+0.5, 1-ratios[idx-1]!, idx+0.5, 1-rat, color)
                        flows.push(line)
                    } else if (ratios[idx-1] !== null){
                        let line = createBezier(last_pointed_idx+0.5, 1-ratios[idx-1]!, idx+0.5, 1-rat, color)
                        flows.push(line)
                    }
                }
                last_pointed_idx = idx
            }
        })
    })
    /* let svg = <svg viewBox={`0 0 ${size?.width || 1}, ${size?.height || 1}`}>
        {flows}
    </svg> */

    // let legend = data.labels.map(dt => dateConversion(dt))

    let elements: JSX.Element[] = []
    /* legend.forEach(l => elements.push(<div>{l}</div>))
    elements.push(<div></div>) */

    data.series.forEach(serie => {
        serie.points.forEach((point, idx) => {
            let opacity = Math.pow(point/all_max, 1.5)
            // let t = (point/all_max*100).toFixed(0) + '%'
            let t = timeConversionDetailed(point)
            let from = dateConversion(data.labels[idx], 0)
            let to = data.labels[idx+1] ? dateConversion(data.labels[idx+1], -1) : "now"
            let title = `${from} -> ${to}`
            elements.push(<div className={classes.point} style={{ opacity }} title={title}>{t}</div>)
        })
        elements.push(<div className={classes.rowdata}>{serie.label}</div>)
    })

    let heatmap = <div className={classes.heatmap} style={{ "gridTemplateColumns": `repeat(${row_length}, 3rem) auto` }}>
        {elements}
    </div>

    return (
        <div className={classes.svgContainer} ref={svgRef}>
            {heatmap}
        </div>
    )
}
