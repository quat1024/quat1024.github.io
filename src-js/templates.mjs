import * as t from "./tags.mjs";

export function page(partial) {
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
      t.meta({name: "viewport", content: "width=device-width, initial-scale=1"}), //wtf... its name and not 'property'
      
      t.link({ rel: "stylesheet", type: "text/css", href: "/stylin.css" }),
      t.link({ rel: "stylesheet", type: "text/css", href: "/rotator.css" }),
      t.link({ rel: "alternate", type: "application/rss+xml", href: "/feed.xml" }),
      t.link({ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }),

      partial.head ? partial.head() : undefined
    ),
    t.body({}, partial.body)
  );
}

export function layout(partial) {
  return page({
    ...partial,
    body: [
      t.header({},
        t.a({ href: "/", class: "sign", aria_hidden: true },
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
          t.a({ href: "/feed.xml" }, "RSS"),
          t.a({ href: "/posts" }, "Blog")
        )
      ),
      partial.body
    ]
  })
}

export function landing(partial) {
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
      )
    )
  });
}

export function post(post) {
  let motive = post.motive;
  if (!motive) {
    let rand = post.slug.split("").reduce((acc, t) => acc + t.charCodeAt(0), 0)
    let motives = ["cool", "mlem", "think"];
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
            post.created_date,

            post.modified_date ? [" (updated ", post.modified_date, ")"] : undefined,
            post.draft ? t.noEscape(" &mdash; (draft post)") : undefined,
            t.noEscape(" &mdash; "),

            post.tags.length > 0 ?
              post.tags.map(tag => [
                t.a({ href: `/tags/{tag}` }, tag), " "
              ]) : "Untagged"
          ),
        ),
        t.noEscape(post.rendered),
        t.hr({ class: motive })
      )
    ]
  });
}