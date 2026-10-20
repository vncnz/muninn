import { JSX, useLayoutEffect, useRef, useState } from "react";
import classes from "./HeatmapChart.module.scss";
import { HeatmapRow, MultiColLabel } from "../types";

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

export function HeatmapChart({ data, legend }: { data: HeatmapRow[], legend: MultiColLabel[] }) {

    const svgRef = useRef<HTMLDivElement | null>(null)
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

    // let dates: {date: String, max: number}[] = data.labels.map(lbl => { return { date: lbl, max: 0 } })
    /* data.series.forEach((serie: GraphSerie) => {
        serie.points.forEach((v: number, idx: number) => {
            dates[idx].max = Math.max(dates[idx].max, v)
        })
    }) */
    let all_max = Math.max(...data.map(el => Math.max(...el.points.map(p => p.v))))
    // let row_length = dates.length

    let elements: JSX.Element[] = []
    let row_length = data?.length ? data[0].points.length : 1
    /* legend.forEach(l => elements.push(<div>{l}</div>))
    elements.push(<div></div>) */

    data.forEach(serie => {
        elements.push(<div className={classes.rowdata}>{serie.label}</div>)
        serie.points.forEach(point => {
            let opacity = Math.pow(point.v/all_max, 1.5)
            // let t = (point/all_max*100).toFixed(0) + '%'
            elements.push(
                <div className={classes.point} style={{ 'backgroundColor': `rgba(0, 0, 255, ${opacity})` }} title={point.tooltip}>
                    {/*<span>{point.label}</span>*/}
                    {row_length < 13 ? point.label : ''}
                </div>
            )
        })
    })

    elements.push(<div></div>)

    /* let svg = <svg className={classes.timespan} width="100%" height="3rem">
        
    </svg>
    elements.push(<div style={{ "gridColumn": `span ${row_length}` }}>{svg}</div>) */
    legend.forEach(l => {
        elements.push(<div className={classes.footer} style={{ "gridColumn": `span ${l.width}` }}>{l.label}</div>)
    })



    let heatmap = <div className={classes.heatmap} style={{ "gridTemplateColumns": `auto repeat(${row_length}, 1fr)` }}>
        {elements}
    </div>

    return (
        <div className={classes.svgContainer} ref={svgRef}>
            {heatmap}
        </div>
    )
}
