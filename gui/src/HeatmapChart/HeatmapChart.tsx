import { JSX, useRef } from "react";
import classes from "./HeatmapChart.module.scss";
import { HeatmapRow, MultiColLabel } from "../types";

export function HeatmapChart({ data, legend, vline }: { data: HeatmapRow[], legend: MultiColLabel[], vline: number }) {

    const svgRef = useRef<HTMLDivElement | null>(null)
    // const [size, setSize] = useState<{ width: number; height: number } | null>(null)

    /* useLayoutEffect(() => {
        if (!svgRef.current) return

        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            setSize({ width, height })
        })

        observer.observe(svgRef.current)
        return () => observer.disconnect()
    }, []) */

    let all_max = Math.max(...data.map(el => Math.max(...el.points.map(p => p.v))))

    let elements: JSX.Element[] = []
    let row_length = data?.length ? data[0].points.length : 1

    data.forEach(serie => {
        elements.push(<div className={classes.rowdata}>{serie.label}</div>)
        serie.points.forEach((point, idx) => {
            let opacity = Math.pow(point.v/all_max, 1.5)
            let cl = classes.point
            if (idx / serie.points.length > vline) {
                cl += ' ' + classes.invalid
            }
            elements.push(
                <div className={cl} style={{ 'backgroundColor': `rgba(0, 0, 255, ${opacity})` }} title={point.tooltip}>
                    {row_length < 13 ? point.label : ''}
                </div>
            )
        })
    })

    elements.push(<div></div>)

    elements.push(
        <div className={classes.footer} style={{ "gridColumn": `span ${row_length}` }}>
            {legend.map(l => <span style={{ "flex": `${Math.round(l.width*100)} 1 1px` }}>{l.label}</span>)}
        </div>
    )



    let heatmap = <div className={classes.heatmap} style={{ "gridTemplateColumns": `auto repeat(${row_length}, 1fr)` }}>
        {elements}
    </div>

    return (
        <div className={classes.svgContainer} ref={svgRef}>
            {heatmap}
        </div>
    )
}
