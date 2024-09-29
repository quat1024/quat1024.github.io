import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";

import * as post from "./post.ts"
import * as templates from "./templates.tsx"
import { Gallery2, PhotoDb, PhotoPage, safePhotoName, ZPhotoDb } from "./photos.tsx";

const cwd = process.cwd();
const inDir = path.join(cwd, "in");
const outDir = path.join(cwd, "out");

console.log("cwd:", process.cwd());
console.log("in: ", inDir);
console.log("out:", outDir);
console.log();

console.log("Checking in/");
fs.accessSync(inDir, fs.constants.F_OK);

console.log("Cleaning out/");
fs.rmSync(outDir, { force: true, recursive: true });
//await fs.mkdir(outDir); //https://github.com/denoland/deno/issues/24900

console.log("Copying in/static/ assets");
const staticDir = path.join(inDir, "static");
fs.accessSync(staticDir, fs.constants.F_OK);
fs.cpSync(staticDir, outDir, { recursive: true }); // dont copy static/ if it doesn't exist

console.log("Reading posts");
const inPostsDir = path.join(inDir, "posts");
//TODO wtf is promise doing here
const posts = await Promise.all(fs.readdirSync(inPostsDir)
  // 👇 yeah readdir just gives you filenames :/
  .map(filename => path.join(inPostsDir, filename))
  .map(path => new post.Post(path)));
const postdb = new post.Db(posts);

console.log("Reading photos");
const inPhotosDir = path.join(inDir, "photos");
const photoDbJson = JSON.parse(fs.readFileSync(path.join(inPhotosDir, "photodb.json"), { encoding: "utf-8" }));
const photodb: PhotoDb = ZPhotoDb.parse(photoDbJson);

//photos
console.log("Rendering photos");
const outPhotosDir = path.join(outDir, "photos");
fs.mkdirSync(outPhotosDir, { recursive: true });
fs.writeFileSync(path.join(outPhotosDir, "index.html"), Gallery2({photodb}).show(0))
for(const photo of photodb.photos) {
  const dir = path.join(outPhotosDir, safePhotoName(photo));
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, "index.html"), PhotoPage({photo}).show(0));
}

//discord
console.log("Rendering discord");
const discord = templates.Discord3({inDir}).show(0);
fs.writeFileSync(path.join(outDir, "discord.html"), discord); //old location
fs.mkdirSync(path.join(outDir, "discord"), { recursive: true });
fs.writeFileSync(path.join(outDir, "discord", "index.html"), discord); //new location

//index
console.log("Rendering index");
fs.writeFileSync(path.join(outDir, "index.html"), templates.Landing2({postdb}).show(0));

//rss
console.log("Rendering feed");
fs.writeFileSync(path.join(outDir, "feed.xml"), templates.Feed2({postdb}).show(0, true)); //rss mode

//posts
console.log("Rendering posts");
posts.map(post => {
  const parent = path.join(outDir, "posts", post.slug);
  fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(path.join(parent, "index.html"), post.toHtml().show(0))
});

console.log("Done");