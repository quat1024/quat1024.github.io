import * as marked from "marked"

export function parse(str: string): string {
  return marked.parse(str) as string; //i don't call with the async option
}