import * as marked from "marked"

export function parse(str) {
  return marked.parse(str);
}