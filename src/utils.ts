import { Artist } from "./types"

export const artistsToString = (artists: Artist[]) => {
    if (!artists) {
      console.log('no artists??')
      return ''
    }
    return artists.map((a: Artist) => a.name).join(', ')
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