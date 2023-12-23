import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as datefns from "date-fns";

import * as markdown from "./markdown.mjs"

import { post as postTemplate } from "./templates.mjs"

//java's Comparator.comparingBy
function comparingBy(fn) {
  return (a, b) => fn(a) - fn(b);
}

export class Post {
  markdownSource; //string
  rendered; //string
  
  title; //string
  slug; //string
  author; //string
  subject; //string
  draft; //bool
  created_date_str;
  created_date; //Date
  updated_date_str;
  updated_date; //Date
  description; //string
  
  id; //<- int, filled in when creating a PostDb... ugly
  
  constructor() {
    
  }
  
  async read(path) {
    let fileContents = await fs.readFile(path, {encoding: "utf-8"});
    
    let idx = fileContents.indexOf("---");
    
    //frontmatter
    let frontmatter = {};
    fileContents.slice(0, idx)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length != 0)
      .map(line => line.split('=').map(x => x.trim()))
      .forEach(([key, value]) => frontmatter[key] = hrmm(value));

    this.title = frontmatter.title;
    this.slug = frontmatter.slug;
    this.author = frontmatter.author;
    this.subject = frontmatter.subject;
    this.draft = frontmatter.draft ? true : false;
    this.created_date_str = frontmatter.created_date;
    this.created_date = datefns.parse(frontmatter.created_date, "MMM d, y", new Date());
    this.updated_date_str = frontmatter.updated_date;
    this.updated_date = frontmatter.updated_date ? datefns.parse(frontmatter.updated_date, "MMM d, y", new Date()) : undefined;
    this.description = frontmatter.description ? frontmatter.description : "";
    
    //the rest of the owl
    this.markdownSource = fileContents.slice(idx + 3).trim();
    this.rendered = (await markdown.parse(this.markdownSource)).replace('\r', ""); //Windows moment
    
    return this;
  }
  
  toHtml() {
    return postTemplate({
      ...this,
      blurb: this.description,
      created_date: datefns.format(this.created_date, "MMM d, y"),
      updated_date: this.updated_date ? datefns.format(this.updated_date, "MMM d, y") : null
    });
  }
}

export class Db {
  //int -> Post
  postsById;
  
  //string -> int
  bySlug;
  
  //subject -> [int]
  bySubject;
  
  //[int]
  chronological;
  
  // Post[]
  constructor(posts) {
    console.log("hi");
    
    //integer ids
    this.postsById = {};
    for(var i = 0; i < posts.length; i++) {
      posts[i].id = i;
      this.postsById[i] = posts[i];
    }
    
    //by slug
    this.bySlug = {};
    posts.forEach(post => this.bySlug[post.slug] = post.id);
    
    //by primary tag
    this.bySubject = {};
    posts.forEach(post => {
        if(!this.bySubject[post.subject])
          this.bySubject[post.subject] = [];
        this.bySubject[post.subject].push(post.id);
    });
    
    //chronological
    this.chronological = [...posts].sort((a, b) => datefns.compareAsc(a.created_date, b.created_date)).map(p => p.id);
  }
  
  subjects() {
    return Object.keys(this.bySubject);
  }
}

function hrmm(what) {
  if (what === "true")
    return true;
  else if (what === "false")
    return false;
  else
    return what;
}