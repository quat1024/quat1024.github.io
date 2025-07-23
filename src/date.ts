import datefns from "date-fns";

export function parseDate(date: string): Date {
  return datefns.parse(date, "MMM d, y", new Date());
}

export function parseExifDate(date: string): Date {
  //Blame this guy if it's wrong https://stackoverflow.com/questions/22568927/how-to-parse-exif-date-time-data
  date = date.trim();
  
  //slice off any subsecond values since datefns chokes on them
  const dot = date.lastIndexOf('.');
  if(dot != -1) {
    date = date.slice(0, dot);
  }
  
  console.log("trying to parse date", date);
  let result = datefns.parse(date, "yyyy:MM:dd HH:mm:ss", new Date());
  if((result as any) == "Invalid Date") {
    console.log("failed to parse", date, "with first format, try second");
    result = datefns.parse(date, "yyyy:MM:dd HH:mm:ss.SSS", new Date());
    if((result as any) == "Invalid Date") {
      console.log("failed to parse date", date);
    }
  }
  
  //my god
  try {
    result.toISOString();
  } catch(e) {
    throw new Error("the string '" + date + "' parsed as an invalid date")
  }
  
  
  return result;
}

export function compareDatesAsc(a: Date | undefined, b: Date | undefined): number {
  if(!a && !b) return 0;
  else if(!a) return -1; //TODO do these signs make sense...
  else if(!b) return 1;
  else return datefns.compareAsc(a, b);
}

export function writeDate(date: Date): string {
  //console.log("calling writeDate with", date);
  return datefns.format(date, "MMM d, y");
}