import classes from "./VisualTable.module.scss";
import { useState } from "react";

// type counterDict = Record<string, number>;

export type Column<T> = {
  key: keyof T;
  label: string;
  align?: "left" | "right";
  format?: (value: T[keyof T]) => string;
};

type VisualTableProps<T> = {
  visualkey: keyof T;
  columns: Column<T>[];
  rows: T[];
  // onHoverRow?: (row: T | null) => void;
  // onSelectRow?: (row: T | null) => void;
};



export function VisualTable<T extends object>({
    visualkey,
    columns,
    rows,
    // rowId,
    // onHoverRow,
    // onSelectRow,
    }: VisualTableProps<T>) {
    const [selectedRowIdx, setSelectedRowIdx] = useState(-1);
    // console.log(data)

    let full = rows.reduce((acc: number, v: any) => acc + v[visualkey], 0)
    let cumulate = 0
    /* let colors = ["rgb(200, 0, 0)", "rgb(0, 200, 0)", "rgb(0, 0, 200)", 
                  "rgb(200, 0, 200)", "rgb(200, 200, 0)", "rgb(0, 200, 200)",
                  "rgb(100, 100, 100)", "rgb(100, 200, 100)"] */
    let colors = ['#57737a', '#85bdbf', '#c2fcf7', '#d9fdff', '#e9feff']
    
    let rectangles = rows.map((el: any, idx: number) => {
        let v = el[visualkey] / full
        cumulate += v
        let col = idx < colors.length ? colors[idx] : colors[colors.length - 1]
        return <div
            style={{ flex: `${v} 1 0`, backgroundColor: col }}
            key={idx}
            className={idx === selectedRowIdx ? classes.rectHovered : ''}
            
                onMouseEnter={() => onHoverRow?.(idx)}
                onMouseLeave={() => onHoverRow?.(-1)}
            >
        </div>
    })
    let stack =
        <div className={classes.stack}>
            {rectangles}
        </div>

    const onHoverRow = (idx: number) => {
        setSelectedRowIdx(idx)
    }

    let tableRows = rows.map((row, index) => {
        // const id = rowId ? rowId(row) : index.toString();
        const id = index.toString()

        return (
            <tr
                key={id}
                onMouseEnter={() => onHoverRow?.(index)}
                onMouseLeave={() => onHoverRow?.(-1)}
                className={index === selectedRowIdx ? classes.rowHovered : ''}
                // onClick={() => onSelectRow?.(row)}
            >
                {columns.map(col => {
                const value = row[col.key];
                return (
                    <td
                        key={String(col.key)}
                        style={{ textAlign: col.align }}
                    >
                    {col.format
                        ? col.format(value)
                        : String(value)}
                    </td>
                );
                })}
            </tr>
        );
    })
    
    return (
        <div className={classes.visualTable}>
            {stack}
            <table>
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={String(col.key)} style={{ textAlign: col.align }}>
                            {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableRows}
                </tbody>
            </table>
        </div>
    )
}
