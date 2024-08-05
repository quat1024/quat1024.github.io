import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";

import * as h from "./tags.mjs"
import * as post from "./post.mjs"
import * as templates from "./templates.mjs"

const ignore = _ => { };

let cwd = process.cwd();
let inDir = path.join(cwd, "in");
let outDir = path.join(cwd, "out");

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
let staticDir = path.join(inDir, "static");
fs.accessSync(staticDir, fs.constants.F_OK);
fs.cpSync(staticDir, outDir, { recursive: true }); // dont copy static/ if it doesn't exist

console.log("Reading posts");
let inPostsDir = path.join(inDir, "posts");
let posts = await Promise.all(fs.readdirSync(inPostsDir)
  // 👇 yeah readdir just gives you filenames :/
  .map(filename => path.join(inPostsDir, filename))
  .map(path => new post.Post().read(path)));

let postdb = new post.Db(posts);

console.log("Rendering pages");
fs.mkdirSync(path.join(outDir, "discord"), {recursive: true});

  fs.writeFileSync(path.join(outDir, "index.html"), templates.landing(postdb).renderToString());
  
  fs.writeFileSync(path.join(outDir, "discord.html"), templates.discord().renderToString()); //old location
  fs.writeFileSync(path.join(outDir, "discord", "index.html"), templates.discord().renderToString()); //new location
  
  
  posts.map(post => {
    let parent = path.join(outDir, "posts", post.slug);
    fs.mkdirSync(parent, {recursive: true});
    fs.writeFileSync(path.join(parent, "index.html"), post.toHtml().renderToString())
  });

console.log("Done");