type counterDict = Record<string, number>;

export default function Pie ({ data }: { data: counterDict }) {
    // console.log(data)

    let full = Object.values(data).reduce((acc: number, v: number) => acc + v, 0)
    let cumulate = 0
    let radius = 10
    let color = -1
    let colors = ["rgb(200, 0, 0)", "rgb(0, 200, 0)", "rgb(0, 0, 200)", 
                    "rgb(200, 0, 200)", "rgb(200, 200, 0)", "rgb(0, 200, 200)",
                    "rgb(100, 100, 100)", "rgb(100, 200, 100)"]
    let circles = Object.keys(data).map((k, idx) => {
        let v = data[k] / full
        let dash = "0 " + (cumulate * Math.PI * radius) + " " + (v * Math.PI * radius) + " 1000"
        // console.log(k, data[k] / full, cumulate)
        color = (color + 1) % colors.length
        cumulate += v
        return <circle r="5" cx={radius} cy={radius} fill="transparent"
                stroke={colors[color]}
                stroke-width={radius-idx/2}
                stroke-dasharray={dash} />
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
