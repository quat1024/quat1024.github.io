import datefns from "date-fns";

export function parseDate(date: string): Date {
  return datefns.parse(date, "MMM d, y", new Date());
}

export function parseExifDate(date: string): Date {
  //Blame this guy if it's wrong https://stackoverflow.com/questions/22568927/how-to-parse-exif-date-time-data
  return datefns.parse(date, "yyyy:MM:dd HH:mm:ss", new Date());
}

export function compareDatesAsc(a: Date, b: Date): number {
  return datefns.compareAsc(a, b);
}

export function writeDate(date: Date): string {
  return datefns.format(date, "MMM d, y");
}