import { songStat } from "../types";
// type counterDict = Record<string, number>;

export default function Pie ({ data }: { data: songStat[] }) {
    // console.log(data)

    let full = data.reduce((acc: number, v: songStat) => acc + v.time, 0)
    let cumulate = 0
    let radius = 10
    let color = -1
    let colors = ["rgb(200, 0, 0)", "rgb(0, 200, 0)", "rgb(0, 0, 200)", 
                  "rgb(200, 0, 200)", "rgb(200, 200, 0)", "rgb(0, 200, 200)",
                  "rgb(100, 100, 100)", "rgb(100, 200, 100)"]
    let circles = data.map((el, idx) => {
        let v = el.time / full
        let dash = "0 " + (cumulate * Math.PI * radius) + " " + (v * Math.PI * radius) + " 1000"
        // console.log(k, data[k] / full, cumulate)
        color = (color + 1) % colors.length
        cumulate += v
        return <circle r="5" cx={radius} cy={radius} fill="transparent"
                stroke={colors[color]}
                // strokeWidth={radius-idx/2}
                strokeWidth={radius}
                strokeDasharray={dash} />
    })
    let pieEventNumber =
        <svg height="20%" width="20%" viewBox="0 0 20 20">
        <circle r="10" cx="10" cy="10" fill="rgb(0,0,0,0.1)" />
                {circles}
        </svg>
    return (
        pieEventNumber
    )
}
