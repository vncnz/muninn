import { Artist, LyricsRow } from "./types"

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

export function dateToHuman (dateString: string) {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
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

export function timeConversionDetailed (secs: number) {

    const minutes = (secs / 60).toFixed(0);
    const hours = (secs / (60 * 60)).toFixed(0);
    const days = (secs / (60 * 60 * 24)).toFixed(0);

    if (secs === 0) {
        return '.'
    } if (secs < 60) {
        return secs + "s";
    } else if (parseFloat(minutes) < 60) {
        return minutes + "m";
    } else if (parseFloat(hours) < 24) {
        return hours + "h" + (parseInt(minutes) % 60) + "m";
    } else {
        return days + "d" + hours + "h"
    }
}

export function dateConversion (date: string, diff: number) {
  let dt = new Date(date)
  if (diff) { dt.setDate(dt.getDate() + diff) }
  return dt.toLocaleDateString("en-US", {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
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
    // if (size < 11) return palette10
    // if (size < 26) return palette25
    if (size < 33) return palette32
    let arr = palette32
    let i = 32
    while (i < size) {
        arr = arr.concat(palette32)
        i += 32
    }
    return arr
}

export const parseLyricsString = (raw: String) => {
  let lyricsRows = [] as LyricsRow[];
  let lines = raw.split("\n");
  console.log('lines.length', lines.length)
  for (let line of lines) {
      let match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (match) {
          let minutes = parseInt(match[1]);
          let seconds = parseFloat(match[2]);
          let text = match[3].trim();
          let time = minutes * 60 + seconds;
          lyricsRows.push({ time: time, text: text });
      }
  }
  return lyricsRows
}

interface MonthBreakdown {
  year: number;
  month: number; // 0-indexed (0 = January, etc.)
  monthName: string;
  daysInSpan: number;
  percentage: number;
}

export const calculateDateSpanMonths = (daysAgoA: number, daysAgoB: number): MonthBreakdown[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the two dates
  const dateA = new Date(today);
  dateA.setDate(today.getDate() - daysAgoA);

  const dateB = new Date(today);
  dateB.setDate(today.getDate() - daysAgoB);

  // Ensure startDate is earlier and endDate is later
  const startDate = dateA < dateB ? dateA : dateB;
  const endDate = dateA > dateB ? dateA : dateB;

  // Calculate total duration in days (inclusive of both start and end days)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const monthMap: { [key: string]: number } = {};

  // Iterate through each day in the range and tally it by month
  const current = new Date(startDate);
  while (current <= endDate) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const key = `${year}-${month}`;

    monthMap[key] = (monthMap[key] || 0) + 1;

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  // Format the results into an array with percentages
  const results: MonthBreakdown[] = Object.keys(monthMap).map((key) => {
    const [yearStr, monthStr] = key.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInSpan = monthMap[key];
    const percentage = Number(((daysInSpan / totalDays) * 100).toFixed(2));

    const monthName = new Date(year, month, 1).toLocaleString("default", {
      month: "long",
    });

    return {
      year,
      month,
      monthName,
      daysInSpan,
      percentage,
    };
  });

  return results;
}