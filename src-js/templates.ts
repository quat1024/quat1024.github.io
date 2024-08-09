import * as t from "./tags.ts";
import * as post from "./post.ts";

export type PagePartial = {
  title?: string,
  blurb?: string,
  head?: () => t.TagBody,
  body: t.TagBody
}

export function page(partial: PagePartial): t.Tag {
  let title = "Highly Suspect Agency";
  if (partial.title)
    title = `${partial.title} - ${title}`;

  return t.html({ lang: "en" },
    t.head({},
      t.title({}, title),
      t.meta_("og:title", title),
      t.meta_("og:type", "website"),
      t.meta_("og:url", "https://highlysuspect.agency"),
      t.meta_("og:image", "https://highlysuspect.agency/favicon128.png"),
      partial.blurb ? t.meta_("og:description", partial.blurb) : undefined,
      t.meta_("theme-color", "#950000"),
      t.meta({ name: "viewport", content: "width=device-width, initial-scale=1" }), //wtf... its name and not 'property'

      t.link({ rel: "stylesheet", type: "text/css", href: "/stylin.css" }),
      t.link({ rel: "stylesheet", type: "text/css", href: "/rotator.css" }),
      t.link({ rel: "alternate", type: "application/rss+xml", href: "/feed.xml" }),
      t.link({ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }),

      partial.head ? partial.head() : undefined
    ),
    t.body({}, partial.body)
  );
}

export function layout(partial: any) {
  return page({
    ...partial,
    body: [
      t.header({},
        t.a({ href: "/", class: "sign", aria_hidden: true, tabindex: -1 }, //decorative duplicate link
          t.div({ class: "circle s1" }),
          t.div({ class: "cover s2" }),
          t.div({ class: "circle s3" }),
          t.div({ class: "cover s4" }),
          t.div({ class: "iris" })
        ),
        t.h1({},
          t.a({ href: "/" }, "Highly Suspect Agency")
        ),
        t.nav({},
          t.a({ href: "/feed.xml" }, "RSS")
        )
      ),
      partial.body
    ]
  })
}

export function recents(postdb: post.Db) {
  const topThree = postdb.chronological.reverse().slice(0, 3)
    .map(id => postdb.postsById[id])
    .map(post => postInfo(post));

  return [
    t.p({}, "Here are the three most recent posts."),
    t.ul({}, topThree as any)
  ]
}

export function topics(postdb: post.Db) {
  const bySubject: Record<string, post.Post[]> = {};

  for (const id of postdb.chronological) {
    const post = postdb.postsById[id];

    if (!bySubject[post.subject])
      bySubject[post.subject] = [];
    bySubject[post.subject].push(post);
  }

  const subjects = [...Object.keys(bySubject)];
  subjects.sort();
  subjects.sort((a, b) => bySubject[b].length - bySubject[a].length);

  const result = [];
  for (const subj of subjects) {
    result.push([
      t.h3({}, `On ${subj}`),
      t.ul({},
        ...bySubject[subj].map(post => postInfo(post))
      )
    ]);
  }

  return result;
}

export function landing(postdb: post.Db) {
  return layout({
    body: t.article({},
      t.h1({}, "Hey"),

      ...t.prose_(
        t.noEscape(`I'm quaternary, but you can call me quat. I write <a href="https://www.curseforge.com/members/quat1024/projects" target="_blank">Minecraft mods</a>.`),
        t.noEscape(`I've also been working on maintaining <a href="https://github.com/CrackedPolishedBlackstoneBricksMC/voldeloom" target="_blank">Gradle tooling for decade-old Minecraft Forge versions</a>, experimenting with <a href="https://github.com/quat1024/AutoThirdPerson" target="_blank">cursed Gradle megaprojects</a> to ease the updating and backporting workload, and learning <a href="https://github.com/quat1024/hatchery" target="_blank">a bit of Rust</a>. Previously I made a bunch of <a href="https://steamcommunity.com/id/quaternary/myworkshopfiles/" target="_blank">Portal 2 test chambers</a>.`),
        "Rrrrarh! 🐲"
      ),
      t.h2({}, "Let's talk"),
      ...t.prose_(
        t.noEscape(`To ask a question about my Minecraft mods, please leave a comment, join my <a href="/discord">public Discord</a>, or send a <a href="https://www.curseforge.com/members/quat1024/projects">CurseForge message.</a>`),
        t.noEscape(`For other inquiries, email me: <a href="mailto:quat@highlysuspect.agency">quat@highlysuspect.agency</a>`)
      ),
      t.h2({}, "Writing"),
      recents(postdb) as any, //TODO
      t.p({}, "And here's the rest."),
      topics(postdb) as any //TODO
    )
  });
}

export function postInfo(post: post.Post) {
  return t.li({},
    t.span({ class: "date" }, post.created_date_str),
    t.a({ href: `/posts/${post.slug}` }, post.title),
    post.draft ? " (DRAFT)" : undefined,
    post.description ? [
      t.br({}),
      post.description
    ] : undefined as any //TODO
  );
}

export function post_(post: post.Post) {
  let motive = post.motive;
  if (!motive) {
    const rand = post.slug.split("").reduce((acc, t) => acc + t.charCodeAt(0), 0)
    const motives = ["cool", "mlem", "think"];
    motive = motives[rand % motives.length];
  }

  return layout({
    ...post,
    blurb: post.description,
    body: [
      t.article({},
        t.div({ class: "bigheader" },
          t.h1({}, post.title),
          t.div({ class: "byline" },
            post.author,
            ", ",
            post.created_date as any, //TODO

            //post.modified_date ? [" (updated ", post.modified_date, ")"] : undefined,
            post.draft ? t.noEscape(" &mdash; (draft post)") : undefined,
            t.noEscape(" &mdash; "),

            post.subject
          ),
        ),
        t.noEscape(post.rendered),
        t.hr({ class: motive })
      )
    ]
  });
}

export function discord() {
  return layout({
    body: t.article({}, t.noEscape(`
    <h1>Hello!</h1>
    <p>This is a landing page I made so I don't need to update fifteen thousand links when I need to change the invite link.</p>
    <p>If you'd like to go to my Discord server, <a href="https://discord.gg/WUXsbGH">step right this way</a>. To go to my Matrix room,
    <a href="https://matrix.to/#/#quat_mods:matrix.org">step this way instead</a>.</p>
    <h2>Other contacts</h2>
    <p>If you need help or support, but don't want to use Discord or Matrix:</p>
    <ul>
    <li>Leave a comment on the mod's CurseForge page.</li>
    <li>Open an issue on the mod's issue tracker. It's okay if you don't have "an issue" and just want to ask a question, I don't mind.
    The issue tracker is usually on GitHub and linked on the mod's CurseForge or Modrinth page. All my mods are open-source on Github so if
    there's no link, let me know.</li>
    <li>Email me: <a href="mailto:quat@highlysuspect.agency">quat@highlysuspect.agency</a>
    <li>Ping me on Twitter, <a href="https://twitter.com/quat1024" target="_blank">@quat1024</a>. Just @ me, i don't check DMs often.</li>
    </ul>
    <p>Unfortunately I cannot provide support for my old Forge 1.12 mods.</p>
    <h2>Things you don't need to tell me about</h2>
    <p>I am well aware that Minecraft 1.21 is out. Please be patient.`)
    )
  });
}