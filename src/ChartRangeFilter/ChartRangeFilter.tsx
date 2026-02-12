import { useLayoutEffect, useRef, useState } from "react";
import classes from "./ChartRangeFilter.module.scss";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAnglesLeft, faAngleLeft, faAngleRight, faAnglesRight } from '@fortawesome/free-solid-svg-icons'

export interface RangeFilter {
    from: number,
    to: number
}
export interface RangeSettings {
    default: RangeFilter,
    min: number,
    max: number,
    rangeCallback: Function
}

export function ChartRangeFilter({ settings }: { settings: RangeSettings }) {

    const rangeRef = useRef<HTMLDivElement | null>(null)

    const [range, setRange] = useState<RangeFilter>(settings.default)
    
    /* const updateGroupingDays = (e: { target: { value: any; } }) => {
        console.log('updateGroupingDays', e)
        let num = parseInt(e.target.value)
        if (num > 0) setGroupingDays(num)
    } */

    useLayoutEffect(() => {
        /* if (!svgRef.current) return

        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            setSize({ width, height })
        })

        observer.observe(svgRef.current)
        return () => observer.disconnect() */
    }, [])

    let changeFrom = (diff: number) => {
        if (range.from+diff < range.to) {
            let r = { from: range.from+diff, to: range.to }
            setRange(r)
            settings.rangeCallback(r)
        }
    }
    let changeTo = (diff: number) => {
        let newTo = Math.min(Math.max(range.from+1, range.to+diff), 0);
        if (newTo != range.to) {
            let r = { from: range.from, to: newTo }
            setRange(r)
            settings.rangeCallback(r)
        }
    }

    console.log('rangefilter settings', settings, range)

    return (
        <div className={classes.rangeFilter} ref={rangeRef}>
            <div className={classes.periodControl}>
                <div>
                    <div className={classes.movs}>
                        <a onClick={() => { changeFrom(-10) }}><FontAwesomeIcon icon={faAnglesLeft} /></a>
                        <a onClick={() => { changeFrom(-1) }}><FontAwesomeIcon icon={faAngleLeft} /></a>
                        <a onClick={() => { changeFrom(1) }}><FontAwesomeIcon icon={faAngleRight} /></a>
                        <a onClick={() => { changeFrom(10) }}><FontAwesomeIcon icon={faAnglesRight} /></a>
                    </div>
                </div>
                <div>
                    <div className={classes.movs}>
                        <a onClick={() => { changeTo(-10) }}><FontAwesomeIcon icon={faAnglesLeft} /></a>
                        <a onClick={() => { changeTo(-1) }}><FontAwesomeIcon icon={faAngleLeft} /></a>
                        <a onClick={() => { changeTo(1) }}><FontAwesomeIcon icon={faAngleRight} /></a>
                        <a onClick={() => { changeTo(10) }}><FontAwesomeIcon icon={faAnglesRight} /></a>
                    </div>
                </div>
            </div>
        </div>
    )
}
