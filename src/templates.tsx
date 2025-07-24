import * as t from "./tags.ts";
import * as post from "./post.ts";
import * as util from "./util.ts";
import { createElement } from "./jsx.ts";

export type Page2Props = {
  title?: string,
  head?: t.Showable[],

  og?: {
    description?: string,
    image?: string,
    url?: string,
  },
}

export function Page2(props: Page2Props = {}, ...body: t.Tag[]): t.Showable {
  if (props == null) props = {};

  const title = props.title ? `${props.title} - Highly Suspect Agency` : "Highly Suspect Agency";

  const ogTags: t.Showable[] = [
    <meta property="og:title" content={title} />,
    <meta property="og:type" content="website" />,
    <meta property="theme-color" content="#950000" />,
    <meta name="fediverse:creator" content="@quat@woof.group" />
  ];

  if (props.og) {
    ogTags.push(...[
      <meta property="og:url" content={props.og.url || "https://highlysuspect.agency"} />,
      <meta property="og:image" content={props.og.image || "https://highlysuspect.agency/favicon128.png"} />
    ]);
    if (props.og.description) {
      ogTags.push(<meta property="og:description" content={props.og.description} />);
    }
  }

  const head = [
    ...ogTags,
    <meta name="viewport" content="width=device-width, initial-scale=1" />,
    <link rel="stylesheet" type="text/css" href="/stylin.css?cbust=8" />,
    <link rel="stylesheet" type="text/css" href="/rotator.css" />,
    <link rel="alternate" type="application/rss+xml" href="/feed.xml" />,
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />,
    ...(props.head || [])
  ];

  return <html lang="en">
    <head>
      <title>{title}</title>
      {...head}
    </head>
    <body>
      {...body}
    </body>
  </html>
}

export function Layout2(props: Page2Props = {}, ...body: t.Tag[]): t.Showable {
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
      <div class="vert">
      <h1>
        <a href="/">Highly Suspect Agency</a>
      </h1>
      <nav>
        <a href="https://notes.highlysuspect.agency/">Garden</a>
        <a href="/photos/">Photos</a>
        <a href="/feed.xml">RSS</a>
      </nav>
      </div>
    </header>
    {...body}
  </Page2>
}

export function Feed2(): t.Showable {
  return <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
      <title>Highly Suspect Agency</title>
      <description>🤔</description>
      <link>https://highlysuspect.agency/feed.xml</link>
      <atom:link href="https://highlysuspect.agency/feed.xml" rel="self" type="application/rss+xml" />
      <item>
        <title>301 Moved Permanently</title>
        <link>https://notes.highlysuspect.agency/blog/</link>
        <guid>https://notes.highlysuspect.agency/blog/</guid>
        <pubDate>Thu, 24 Jul 2025 16:37:39 GMT</pubDate>
        <content:encoded>
          {"<![CDATA["}
          I've moved my blog over to https://notes.highlysuspect.agency/blog/ .
          I ended up preferring the more unstructured "digital-garden" style of internet writing, and I'm more than happy to blast through
          the mountain of tech-debt powering <i>this</i> website.
          Sorry for the trouble! I'll update here one final time when I add a new RSS feed to subscribe to.
          {"]]>"}
        </content:encoded>
      </item>
    </channel>
  </rss>
}

export async function Landing2(props: { inDir: string }): Promise<t.Showable> {
  if (props == null) throw new Error("null props");

  return <Layout2 head={[<script type="module" src="/js/gravity.mjs"></script>]}>
    <article>
      {await util.readToMarkdown(props.inDir, "landing.md")}
      <h2>Blogroll</h2>
      {buttons()}
      <p class="buttonsubtitle">This one's mine: <img style="vertical-align:bottom;" src="/img/button/hsa.gif" /> ~ <input type="checkbox" id="organize" /><label for="organize">Organize</label></p>
    </article>
  </Layout2>
}

function buttons(): t.Showable {
  const imgbuttons: { title: string, href: string, img: string }[] = [
    { title: "Highly Suspect Agency", href: "/", img: "/img/button/hsa.gif" },
    { title: "birzeblog", href: "https://alyaza.neocities.org/", img: "/img/button/alyaza.gif" },
    { title: "Crouton", href: "https://crouton.net", img: "/img/button/crouton.png" },
    { title: "niss", href: "https://niss.website", img: "/img/button/niss.png" },
    { title: "tom", href: "https://cervine.online", img: "/img/button/tom.png" },
    { title: "clip", href: "https://lizard.tools", img: "/img/button/clip.png" },
    { title: "beeps", href: "https://beeps.website", img: "/img/button/beeps.gif" },
    { title: "Renkon", href: "https://renkotsuban.com/", img: "/img/button/renkon.gif" },
    { title: "Heather Flowers", href: "https://buttondown.com/HTHR", img: "/img/button/hthr.png" },
    { title: "Dex", href: "https://dexthedragon.co.uk/", img: "/img/button/dex.png" },
    { title: "wyx", href: "https://wyx.gay/", img: "/img/button/wyx.png" },
    { title: "ebu", href: "https://lucario.dev/", img: "/img/button/ebu.gif" },
    { title: "88x31", href: "http://cyber.dabamos.de/88x31/", img: "/img/button/88x31.gif" },
  ];

  const textbuttons: { label: string, href: string, color: string }[] = [
    { label: "jvns", href: "https://jvns.ca/", color: "#ff5e00" },
    { label: "rachel", href: "https://rachelbythebay.com/w/", color: "#80d0f0" },
    { label: "aphyr", href: "https://aphyr.com/", color: "#e8e7e3" },
    { label: "matklad", href: "https://matklad.github.io/", color: "#ba3925" }
  ];

  const huh = [];
  for (const b of imgbuttons) {
    huh.push(
      <a class="_88x31" href={b.href} title={b.title} target="_blank"><img src={b.img} width="88" height="31" /></a>
    );
  }
  for (const b of textbuttons) {
    //const styl = "--textbutton-color: " + b
    huh.push(
      <a class="_88x31 textbutton" href={b.href} target="_blank" style={`--textbutton-color: ${b.color};`}>{b.label}</a>
    );
  }

  return <div id="gravity">
    {...huh}
  </div>
}

export function PostPage2(props: { post: post.Post }): t.Showable {
  if (props == null) throw new Error("null props");
  const post = props.post;

  const newlink = `https://notes.highlysuspect.agency/blog/${post.slug}`;
  const meta_refresh = <meta http-equiv="refresh" content={"3;url=" + newlink}></meta>
  
  const og = { description: post.description, url: newlink}
  return <Layout2 title={"MOVED - " + post.title} og={og} head={[meta_refresh]}>
    <article>
      <div class="bigheader">
        <h1>Content moved</h1>
      </div>
      <p>Content moved to my new website. Sorry for the trouble.</p>
      <p>You should be redirected shortly. <a href={newlink}>If you are not redirected, click here</a>.</p>
    </article>
  </Layout2>
}

export async function Discord3(props: { inDir: string }): Promise<t.Showable> {
  const og = {
    url: "https://highlysuspect.agency/discord/"
  }

  return <Layout2 og={og}>
    <article>
      {await util.readToMarkdown(props.inDir, "discord.md")}
    </article>
  </Layout2>
}
