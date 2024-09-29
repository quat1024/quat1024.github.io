import * as fsp from "node:fs/promises";
import * as path from "node:path";
import * as markdown from "./markdown.ts";
import * as tags from "./tags.ts";

export async function readToString(...p: string[]): Promise<string> {
  return await fsp.readFile(path.join(...p), { encoding: "utf-8"});
}

export async function readToJson(...p: string[]): Promise<string> {
  return JSON.parse(await readToString(...p));
}

export async function readToZod<T>(schema: {parse: (d: unknown) => T}, ...p: string[]): Promise<T> {
  return schema.parse(await readToJson(...p));
}

export async function readToMarkdown(...p: string[]): Promise<tags.Showable> {
  return markdown.parse(await readToString(...p));
}