import classes from "./Stack.module.scss";

type counterDict = Record<string, number>;

export default function Stack ({ data, colors }: { data: counterDict, colors: any }) {
    
    let full = Object.values(data).reduce((acc: number, v: number) => acc + v, 0)
    let cumulate = 0
    
    var items = Object.entries(data)
    items.sort((first, second) => { return first[1] - second[1] })
    var keys = items.map((e) => { return e[0] })

    let circles = keys.map((k: string) => {
        let v = data[k] / full
        // let dash = "0 " + (cumulate * Math.PI * radius) + " " + (v * Math.PI * radius) + " 1000"
        // console.log(k, data[k] / full, cumulate)
        cumulate += v
        return <div style={{ flex: `1 1 ${v*100}px`, color: colors[k] || 'white' }} key={k}>
                    <div style={{ backgroundColor: colors[k] }}></div>
                    <span><span>{k}: {data[k]}</span></span>
                </div>
    })
    let stackEventNumber =
        <div className={classes.stack}>
            {circles}
        </div>
    return (
        stackEventNumber
    )
}
