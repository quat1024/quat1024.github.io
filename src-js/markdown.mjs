import * as marked from "marked"

export async function parse(str) {
  return await marked.parse(str, { async: true });
}