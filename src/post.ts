import fs from "node:fs";
import { parseDate, compareDatesAsc } from "./date.ts"

import { parse as parseMarkdown } from "./markdown.ts"

import { PostPage2 } from "./templates.tsx"

export class Post {
  markdownSource: string;
  rendered: string;
  
  title: string;
  slug: string;
  author: string;
  draft: boolean;
  created_date_str: string;
  created_date: Date;
  updated_date_str: string;
  updated_date: Date | undefined;
  description: string;
  
  motive: string | undefined; //horizontal rule icon
  
  id!: number; //<- int, filled in when creating a PostDb... ugly
  
  constructor(path: string) {
    const fileContents = fs.readFileSync(path, {encoding: "utf-8"});
    const idx = fileContents.indexOf("---");
    
    //frontmatter
    const frontmatter: Record<string, string> = {};
    fileContents.slice(0, idx)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length != 0)
      .map(line => line.split('=').map(x => x.trim()))
      .forEach(([key, value]) => frontmatter[key] = value);

    this.title = frontmatter.title;
    this.slug = frontmatter.slug;
    this.author = frontmatter.author;
    this.draft = parseBool(frontmatter.draft) ? true : false;
    this.created_date_str = frontmatter.created_date;
    this.created_date = parseDate(frontmatter.created_date);
    this.updated_date_str = frontmatter.updated_date;
    this.updated_date = frontmatter.updated_date ? parseDate(frontmatter.updated_date) : undefined;
    this.description = frontmatter.description ? frontmatter.description : "";
    this.motive = frontmatter.motive;
    
    //the rest of the owl
    this.markdownSource = fileContents.slice(idx + 3).trim();
    this.rendered = (parseMarkdown(this.markdownSource)).replace('\r', ""); //Windows moment
    
    return this;
  }
  
  toHtml() {
    return PostPage2({post: this});
  }
}

export class Db {
  //int -> Post
  postsById: Record<number, Post>;
  
  //string -> int
  bySlug: Record<string, number>;
  
  //[int]
  chronological: number[];
  
  // Post[]
  constructor(posts: Post[]) {
    console.log("hi");
    
    //integer ids
    this.postsById = {};
    for(let i = 0; i < posts.length; i++) {
      posts[i].id = i;
      this.postsById[i] = posts[i];
    }
    
    //by slug
    this.bySlug = {};
    posts.forEach(post => this.bySlug[post.slug] = post.id);
    
    //chronological
    this.chronological = [...posts].sort((a, b) => compareDatesAsc(a.created_date, b.created_date)).map(p => p.id);
  }
}

function parseBool(what: string | boolean): boolean {
  if (what === "true")
    return true;
  else if (what === "false")
    return false;
  else if(typeof what == "string")
    throw new Error("can't parse " + what + " as a boolean!");
  else
    return what;
}