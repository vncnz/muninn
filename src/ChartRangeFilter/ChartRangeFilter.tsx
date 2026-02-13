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
    const containerRef = useRef<HTMLDivElement | null>(null)

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

    // console.log('rangefilter settings', settings, range)

    let fromRatio = (range.from - settings.min)/(settings.max - settings.min)
    let toRatio = (range.to - settings.min)/(settings.max - settings.min)
    // console.log('ratios', fromRatio, toRatio)

    const [draggingData, setDraggingData] = useState<{starting_x:number,dragging:'l'|'r'|null}>({ starting_x: 0, dragging: null })
    const startDragging = (evt: any, side: 'l'|'r') => {
        // console.log('mouse evt', evt)
        setDraggingData({ starting_x: evt.pageX, dragging: side })
    }
    const getDayFromPageX = (x: number) => {
        let rect = containerRef.current!.getBoundingClientRect()
        let newRatio = (x - rect.left) / (rect.left + rect.width)
        let newFrom = Math.round((settings.max - settings.min) * newRatio + settings.min + 0.5)
        // console.log('newRatio', newRatio, newFrom)
        return newFrom
    }
    const dragging = (evt: any) => {
        if (draggingData.dragging != null) {
            let newValue = getDayFromPageX(evt.pageX)
            // setDraggingData({ starting_x: evt.pageX, dragging: null })
            if (draggingData.dragging === 'l') {
                if (newValue < range.to) setRange({ from: newValue, to: range.to })
            }
            else if (draggingData.dragging === 'r') {
                if (range.from < newValue) setRange({ from: range.from, to: newValue })
            }
        }
    }
    const endDragging = (_evt: any) => {
        // let newFrom = getDayFromPageX(evt.pageX)
        setDraggingData({ starting_x: 0, dragging: null })
        // setRange({ from: newFrom, to: range.to })
        console.log('draggingData', draggingData)
        settings.rangeCallback(range)
    }

    return (
        <div>
            <div className={classes.rangeContainer} onMouseMove={dragging} onMouseUp={endDragging} onMouseLeave={endDragging} ref={containerRef}>
                <div className={classes.leftCursor} onMouseDown={(evt) => { startDragging(evt, 'l') }} style={{ left: (fromRatio*100)+'%' }}></div>
                <div className={classes.rangeWindow} style={{ left: (fromRatio*100)+'%', right: (100-toRatio*100)+'%' }}></div>
                <div className={classes.rightCursor} onMouseDown={(evt) => { startDragging(evt, 'r') }} style={{ right: (100-toRatio*100)+'%' }}></div>
            </div>
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
        </div>
    )
}
