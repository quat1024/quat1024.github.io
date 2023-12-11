import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as datefns from "date-fns";

import * as markdown from "./markdown.mjs"

function hrmm(what) {
  if (what === "true")
    return true;
  else if (what === "false")
    return false;
  else
    return what;
}

export async function readPost(path) {
  return await fs.readFile(path, { encoding: "utf-8" }).then(async (raw) => {
    let idx = raw.indexOf("---");

    //frontmatter parsing
    let post = {};
    raw.slice(0, idx)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length != 0)
      .map(line => line.split('=').map(x => x.trim()))
      .forEach(([key, value]) => post[key] = hrmm(value));

    if (post.tags)
      post.tags = post.tags.split(',').sort();
    else
      post.tags = [];
    
    if(post.created_date)
      post.created_date = datefns.parse(post.created_date, "MMM d, y", new Date());
    if(post.updated_date)
      post.updated_date = datefns.parse(post.updated_date, "MMM d, y", new Date());

    //marked down
    let md = raw.slice(idx + 3).trim();
    post.rendered = await markdown.parse(md);

    return post;
  })
}

export function db(posts) {
  let slugs = posts.map(post => post.slug).sort();
  let tags = posts.flatMap(post => post.tags).filter((v, i, a) => a.indexOf(v) == i).sort();

  let bySlug = {};
  posts.forEach(post => bySlug[post.slug] = post);
  
  let byTag = {};
  posts.forEach(post => post.tags.forEach(tag => {
    if(!byTag[tag])
      byTag[tag] = [];
    
    byTag[tag].push(post.slug);
  }));
  
  let chronological = [...posts].sort((a, b) => datefns.compareAsc(a.created_date, b.created_date)).map(p => p.slug);

  return {
    slugs,
    tags,
    bySlug, //this one has the actual post bodies in it
    byTag,
    chronological
  }
}