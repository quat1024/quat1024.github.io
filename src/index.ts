import * as fsp from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";

import * as post from "./post.ts";
import * as templates from "./templates.tsx";
import * as util from "./util.ts";
import * as photos from "./photos.tsx";
import { show } from "./tags.ts";

const cwd = process.cwd();
const inDir = path.join(cwd, "in");
const outDir = path.join(cwd, "out");

console.log("cwd:", process.cwd());
console.log("in: ", inDir);
console.log("out:", outDir);
console.log();

console.log("Checking in/");
await fsp.access(inDir, fsp.constants.F_OK);

console.log("Cleaning out/");
await fsp.rm(outDir, { force: true, recursive: true });
//await fs.mkdir(outDir); //https://github.com/denoland/deno/issues/24900

console.log("Copying in/static/ assets");
const staticDir = path.join(inDir, "static");
await fsp.access(staticDir, fsp.constants.F_OK);
await fsp.cp(staticDir, outDir, { recursive: true }); // dont copy static/ if it doesn't exist

console.log("Reading posts");
const inPostsDir = path.join(inDir, "posts");

const posts = (await fsp.readdir(inPostsDir))
  .map((filename) => path.join(inPostsDir, filename)) //readdir just gives you filenames
  .map((path) => new post.Post(path));
const postdb = new post.Db(posts);

console.log("Reading photodb");
const photodb = await util.readToZod(
  photos.ZPhotoDb,
  inDir,
  "photos",
  "photodb.json",
);

async function write(str: string, ...p: string[]) {
  //defensive mkdir (hmm)
  if (p.length > 1) {
    await fsp.mkdir(path.join(...p.slice(0, -1)), { recursive: true });
  }
  await fsp.writeFile(path.join(...p), str);
}

console.log("Rendering everything");
await Promise.all([
  //landing
  write(show(await templates.Landing2({ inDir, postdb })), outDir, "index.html"),

  //posts
  ...(posts.map(async (post) => {
    await write(show(post.toHtml()), outDir, "posts", post.slug, "index.html");
  })),

  //feed
  write(show(templates.Feed2({ postdb }), 0, true), outDir, "feed.xml"),

  //photo gallery
  write(show(photos.Gallery2({ photodb })), outDir, "photos", "index.html"),

  //photos
  ...(photodb.photos.map(async (photo) =>
    await write(
      show(photos.PhotoPage({ photo })),
      outDir,
      "photos",
      photos.safePhotoName(photo),
      "index.html",
    )
  )),

  //discord (IIFE)
  async function () {
    const discord = show(await templates.Discord3({ inDir }));
    await write(discord, outDir, "discord.html"); //old location
    await write(discord, outDir, "discord", "index.html"); //new location
  }(),
]);

console.log("Done");
