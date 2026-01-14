import classes from "./VisualTable.module.scss";

import { songStat } from "../types";
// type counterDict = Record<string, number>;

export default function VisualTable ({ data }: { data: songStat[] }) {
    // console.log(data)

    let full = data.reduce((acc: number, v: songStat) => acc + v.time, 0)
    let cumulate = 0
    let color = -1
    let colors = ["rgb(200, 0, 0)", "rgb(0, 200, 0)", "rgb(0, 0, 200)", 
                  "rgb(200, 0, 200)", "rgb(200, 200, 0)", "rgb(0, 200, 200)",
                  "rgb(100, 100, 100)", "rgb(100, 200, 100)"]
    
    let rectangles = data.map((el: songStat, idx: number) => {
        let v = el.time / full
        cumulate += v
        return <div style={{ flex: `${v} 1 0`, color: colors[idx] || 'white', backgroundColor: colors[idx] }} key={idx}></div>
    })
    let stack =
        <div className={classes.stack}>
            {rectangles}
        </div>

    let statsList = data.map((el, idx) => {
        return <tr key={idx}><td>{el.time}s</td><td>{el.metadata.title}</td><td>{el.metadata.artist}</td><td>{el.metadata.album}</td></tr>
    })
    
    return (
        <div className={classes.visualTable}>
            {stack}
            <table>
                <thead><tr><td>Time</td><td>Title</td><td>Artist</td><td>Album</td></tr></thead>
                <tbody>{statsList}</tbody>
            </table>
        </div>
    )
}
