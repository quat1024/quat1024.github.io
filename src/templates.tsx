import * as t from "./tags.ts";
import * as post from "./post.ts";
import { createElement } from "./jsx.ts";

export function Page2(props: { title?: string, head?: t.TagBody[], blurb?: string }, ...body: t.Tag[]): t.Showable {
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
      {...[props.blurb ?
        <meta property="og:description" content={props.blurb} />
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

export function Layout2(props: { title?: string, head?: t.TagBody[], blurb?: string } = {}, ...body: t.Tag[]): t.Showable {
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
        <a href="/feed.xml">RSS</a>
      </nav>
    </header>
    {...body}
  </Page2>
}

export function Recents2(props: { postdb: post.Db }): t.Showable {
  const postdb = props.postdb;

  const topThree = postdb.chronological.reverse().slice(0, 3)
    .map(id => postdb.postsById[id])
    .map(post => <PostInfo2 post={post} />);

  return <div>
    <p>Here are the three most recent posts.</p>
    <ul>{...topThree}</ul>
  </div>
}

export function All2(props: { postdb: post.Db }): t.Showable {
  const postdb = props.postdb;

  const infos = postdb.chronological.reverse()
    .map(id => postdb.postsById[id])
    .map(post => <PostInfo2 post={post} />);

  return <ul>{...infos}</ul>
}

export function Feed2(props: {postdb: post.Db}): t.Showable {
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

export function Landing2(props: { postdb: post.Db }): t.Showable {
  if (props == null) throw new Error("null props");

  return <Layout2>
    <article>
      <h1>Hey</h1>
      <p>I'm quaternary, but you can call me quat. I write <a href="https://www.curseforge.com/members/quat1024/projects" target="_blank">Minecraft mods</a>.</p>
      <p>I've also been working on maintaining <a href="https://github.com/CrackedPolishedBlackstoneBricksMC/voldeloom" target="_blank">Gradle tooling for decade-old Minecraft Forge versions</a>, experimenting with <a href="https://github.com/quat1024/AutoThirdPerson" target="_blank">cursed Gradle megaprojects</a> to ease the updating and backporting workload, and learning <a href="https://github.com/quat1024/hatchery" target="_blank">a bit of Rust</a>. Previously I made a bunch of <a href="https://steamcommunity.com/id/quaternary/myworkshopfiles/" target="_blank">Portal 2 test chambers</a>.</p>
      <p>Rrrrarh! 🐲</p>
      <h2>Let's talk</h2>
      <p>To ask a question about my Minecraft mods, please join my <a href="/discord">public Discord</a> or send a <a href="https://www.curseforge.com/members/quat1024/projects">CurseForge message.</a></p>
      <p>For other inquiries, email me: <a href="mailto:quat@highlysuspect.agency">quat@highlysuspect.agency</a></p>
      <h2>Blog posts</h2>
      <All2 postdb={props.postdb} />
    </article>
  </Layout2>
}

export function PostInfo2(props: { post: post.Post }): t.Showable {
  if (props == null) throw new Error("null props");
  const post: post.Post = props.post;

  return <li>
    <span class="date">{post.created_date_str}</span>
    <a href={`posts/${post.slug}`}>{post.title}</a>
    {...(post.draft ? ["(DRAFT)"] : [])}
    {...(post.description ? [<br />, post.description] : [])}
    <br /><i>{post.subject}</i>
    <br />
  </li>
}

export function PostInfo2Feed(props: {post: post.Post}): t.Showable {
  if(props == null) throw new Error("null props");
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

  return <Layout2 title={post.title} blurb={post.description}>
    <article>
      <div class="bigheader">
        <h1>{post.title}</h1>
        <div class="byline">
          {...[post.author, ", ", post.created_date_str]}
          {...(post.draft ? [" &mdash; (draft post)"] : [])}
          {" &mdash; "}
          <i>{post.subject}</i>
        </div>
      </div>
      {post.rendered}
      <hr class={motive} />
    </article>
  </Layout2>
}

export function Discord2(): t.Showable {
  return <Layout2>
    <article>
      <h1>Hello!</h1>
      <p>This is a landing page I made so I don't need to update fifteen thousand links when I need to change the invite link. If you'd like to go to my Discord server, <a href="https://discord.gg/WUXsbGH">step right this way</a></p>
      <h2>Other methods</h2>
      <p>If you don't want to use Discord:</p>
      <ul>
        <li>Open an issue on the mod's issue tracker. It's okay if you don't have "an issue" and just want to ask a question, I don't mind.
          The issue tracker is usually on GitHub and linked on the mod's CurseForge or Modrinth page. All my mods are open-source on Github so if
          there's no link, let me know.</li>
        <li>Email me: <a href="mailto:quat@highlysuspect.agency">quat@highlysuspect.agency</a></li>
      </ul>
      <p>Unfortunately I probably cannot provide support for my old Forge 1.12 mods. I've forgotten how they work.</p>
      <h2>Things you don't need to tell me about</h2>
      <p>I am well aware that Minecraft 1.21 is out. Please be patient.</p>
    </article>
  </Layout2>
}

