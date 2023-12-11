import * as fs from "node:fs/promises";
import * as path from "node:path";

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
await fs.access(inDir, fs.constants.F_OK);

console.log("Cleaning out/");
await fs.rm(outDir, { force: true, recursive: true });
await fs.mkdir(outDir);

console.log("Copying in/static/ assets");
let staticDir = path.join(inDir, "static");
await fs.access(staticDir, fs.constants.F_OK)
  .then(_ => fs.cp(staticDir, outDir, { recursive: true }), ignore) // dont copy static/ if it doesn't exist

console.log("Reading posts");
let inPostsDir = path.join(inDir, "posts");
let posts = await fs.readdir(inPostsDir)
  // 👇 yeah readdir just gives you filenames :/
  .then(filenames => filenames.map(x => path.join(inPostsDir, x)))
  .then(paths => Promise.all(paths.map(path => post.readPost(path))));


let postdb = post.db(posts);
//console.log(postdb);

console.log("Rendering pages");

await Promise.all([
  fs.writeFile(path.join(outDir, "index.html"), templates.landing().render()),
  
  ...posts.map(async post => {
    let parent = path.join(outDir, "posts", post.slug);
    await fs.mkdir(parent, {recursive: true})
    return fs.writeFile(path.join(parent, "index.html"), templates.post(post).render())
  })
])

console.log("Done");