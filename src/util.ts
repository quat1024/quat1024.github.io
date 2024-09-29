import * as fs from "node:fs";
import * as path from "node:path";
import * as markdown from "./markdown.ts"

export function readToString(...p: string[]) {
  return fs.readFileSync(path.join(...p), { encoding: "utf-8"});
}

export function readToMarkdown(...p: string[]) {
  return markdown.parse(readToString(...p));
}