import { Artist } from "./types"

export const artistsToString = (artists: Artist[]) => {
    if (!artists) {
      // console.log('no artists??')
      return ''
    }
    try {
    return artists.map((a: Artist) => a.name).join(', ')
    } catch (e) {
        console.log(e, artists)
        return 'err'
    }
}

export function timeToHuman (time: number) {
    let m = Math.floor(time / 60)
    let mins = m > 9 ? m : ('0' + m)
    let s = Math.floor(time % 60)
    let secs = s > 9 ? s : ('0' + s)
    return `${mins}:${secs}`
  }
  export function toPercent (v: number) {
    return Math.round(v * 100) + '%'
  }

export function timeConversion (secs: number) {

    const minutes = (secs / 60).toFixed(1);
    const hours = (secs / (60 * 60)).toFixed(1);
    const days = (secs / (60 * 60 * 24)).toFixed(1);

    if (secs < 60) {
        return secs + "\xa0Sec";
    } else if (parseFloat(minutes) < 60) {
        return minutes + "\xa0Min";
    } else if (parseFloat(hours) < 24) {
        return hours + "\xa0Hrs";
    } else {
        return days + "\xa0Days"
    }
}

export const palette25 = [
  "#4FC3F7", // light blue
  "#FF7043", // orange
  "#9CCC65", // green
  "#BA68C8", // purple
  "#FFD54F", // yellow
  "#F06292", // pink
  "#4DB6AC", // teal
  "#DCE775", // lime
  "#7986CB", // indigo
  "#A1887F", // brown

  "#81D4FA",
  "#FF8A65",
  "#AED581",
  "#CE93D8",
  "#FFE082",
  "#F48FB1",
  "#80CBC4",
  "#E6EE9C",
  "#9FA8DA",
  "#BCAAA4",

  "#29B6F6",
  "#FF5722",
  "#8BC34A",
  "#AB47BC",
  "#FFCA28"
];

export const palette10 = [
  "#4FC3F7", // blue
  "#FF7043", // orange
  "#9CCC65", // green
  "#BA68C8", // purple
  "#FFD54F", // yellow
  "#F06292", // pink
  "#4DB6AC", // teal
  "#DCE775", // lime
  "#7986CB", // indigo
  "#FF8A65"  // coral
];

export const palette32 = [
  "#4FC3F7", "#29B6F6", "#0288D1",
  "#FF7043", "#FF5722", "#E64A19",
  "#9CCC65", "#8BC34A", "#689F38",
  "#BA68C8", "#AB47BC", "#7B1FA2",
  "#FFD54F", "#FFCA28", "#FBC02D",
  "#F06292", "#EC407A", "#C2185B",
  "#4DB6AC", "#26A69A", "#00796B",
  "#DCE775", "#C0CA33",
  "#7986CB", "#5C6BC0",
  "#A1887F", "#8D6E63",
  "#B0BEC5", "#90A4AE"
];

export const getPalette = (size: number) => {
    if (size < 11) return palette10
    if (size < 26) return palette25
    if (size < 33) return palette32
    let arr = palette32
    let i = 32
    while (i < size) {
        arr = arr.concat(palette32)
        i += 32
    }
    return arr
}