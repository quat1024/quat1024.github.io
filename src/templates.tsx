import * as t from "./tags.ts";
import * as post from "./post.ts";
import * as markdown from "./markdown.ts"
import * as fs from "node:fs";
import * as path from "node:path";
import * as util from "./util.ts";
import { createElement } from "./jsx.ts";

export function Page2(props: { title?: string, head?: t.TagBody[], description?: string }, ...body: t.Tag[]): t.Showable {
  if (props == null) props = {};

  let fullTitle = "Highly Suspect Agency";
  if (props.title) {
    fullTitle = `${props.title} - ${fullTitle}`;
  }

  return <html lang="en">
    <head>
      <title>{fullTitle}</title>
      <meta property="og:title" content={fullTitle} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://highlysuspect.agency" />
      <meta property="og:image" content="https://highlysuspect.agency/favicon128.png" />
      {...[props.description ?
        <meta property="og:description" content={props.description} />
        : []]}
      <meta property="theme-color" content="#950000" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet" type="text/css" href="/stylin.css?cbust=2" />
      <link rel="stylesheet" type="text/css" href="/rotator.css" />
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      {...(props.head ? props.head : [])}
    </head>
    <body>
      {...body}
    </body>
  </html>
}

export function Layout2(props: { title?: string, head?: t.TagBody[], description?: string } = {}, ...body: t.Tag[]): t.Showable {
  if (props == null) props = {};

  return <Page2 {...props}>
    <header>
      <a href="/" class="sign" aria-hidden="true" tabindex="-1">
        <div class="circle s1"></div>
        <div class="cover s2"></div>
        <div class="circle s3"></div>
        <div class="cover s4"></div>
        <div class="iris"></div>
      </a>
      <h1>
        <a href="/">Highly Suspect Agency</a>
      </h1>
      <nav>
        <a href="/photos/">Photos</a>
        <a href="/feed.xml">RSS</a>
      </nav>
    </header>
    {...body}
  </Page2>
}

export function All2(props: { postdb: post.Db }): t.Showable {
  const postdb = props.postdb;

  const infos = postdb.chronological.reverse()
    .map(id => postdb.postsById[id])
    .map(post => <PostInfo2 post={post} />);

  return <ul>{...infos}</ul>
}

export function Feed2(props: { postdb: post.Db }): t.Showable {
  const postdb = props.postdb;

  const infos = postdb.chronological
    .map(id => postdb.postsById[id])
    .filter(post => !post.draft)
    .map(post => <PostInfo2Feed post={post} />);

  return <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
      <title>Highly Suspect Agency</title>
      <description>🤔</description>
      <link>https://highlysuspect.agency/feed.xml</link>
      <atom:link href="https://highlysuspect.agency/feed.xml" rel="self" type="application/rss+xml" />
      {...infos}
    </channel>
  </rss>
}

export function Landing2(props: { inDir: string, postdb: post.Db }): t.Showable {
  if (props == null) throw new Error("null props");

  return <Layout2>
    <article>
      {util.readToMarkdown(props.inDir, "landing.md")}
      <h2>Blog posts</h2>
      <All2 postdb={props.postdb} />
    </article>
  </Layout2>
}

export function PostInfo2(props: { post: post.Post }): t.Showable {
  if (props == null) throw new Error("null props");
  const post: post.Post = props.post;

  return <li>
    <a href={`posts/${post.slug}`}>{post.title}</a>
    {...(post.draft ? ["(DRAFT)"] : [])}
    {...(post.description ? [<p>{post.description}</p>] : [])}
    <p class="date">{post.created_date_str}</p>
  </li>
}

export function PostInfo2Feed(props: { post: post.Post }): t.Showable {
  if (props == null) throw new Error("null props");
  const post: post.Post = props.post;

  return <item>
    <title>{post.title}</title>
    <link>https://highlysuspect.agency/posts/{post.slug}</link>
    <guid>https://highlysuspect.agency/posts/{post.slug}</guid>
    <pubDate>{post.created_date.toUTCString()}</pubDate>
    {...(post.description ?
      [<description>{post.description}</description>] : [])}
    <content:encoded>
      {"<![CDATA["}
      {post.rendered}
      {"]]>"}
    </content:encoded>
  </item>

  //TODO: escape CDATA in the rendered post
}

export function PostPage2(props: { post: post.Post }): t.Showable {
  if (props == null) throw new Error("null props");
  const post = props.post;

  let motive = post.motive;
  if (!motive) {
    const rand = post.slug.split("").reduce((acc, t) => acc + t.charCodeAt(0), 0)
    const motives = ["cool", "mlem", "think"];
    motive = motives[rand % motives.length];
  }

  return <Layout2 title={post.title} description={post.description}>
    <article>
      <div class="bigheader">
        <h1>{post.title}</h1>
        <div class="byline">
          {...[post.author, ", ", post.created_date_str]}
          {...(post.draft ? [" &mdash; (draft post)"] : [])}
        </div>
      </div>
      {post.rendered}
      <hr class={motive} />
    </article>
  </Layout2>
}

export function Discord3(props: {inDir: string}): t.Showable {
  return <Layout2>
    <article>
      {util.readToMarkdown(props.inDir, "discord.md")}
    </article>
  </Layout2>
}
