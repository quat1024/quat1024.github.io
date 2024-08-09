slug=rss_is_back
title=RSS feed is back; misc updates
author=quat
description=And other things you don't care about
created_date=Aug 9, 2024
subject=misc
motive=motiveblank
---
Just a quick note that I finally fixed the RSS feed &mdash; rejoyce, all three of you who use it. The items you might have missed are:

* [Reflectively constructing enums at runtime](https://highlysuspect.agency/posts/enum_reflection/), isn't Java fun
* [How to download Java](https://highlysuspect.agency/posts/managing_java/) (this came out more "technically-minded" than I hoped it would, but maybe it's still an ok resource. Finally filled in the missing sections today.)
* [On writing](https://highlysuspect.agency/posts/writing/), vent post (?)

This mess is all because I rolled my own [terrible static site generator](https://github.com/quat1024/quat1024.github.io), which has grown into a perpetual learning project. Originally it was written in Rust. The feed got lost somewhere when I rewrote it in node.js and the lack of typing made my head spin. I've now incrementally rewrote it in [Deno](https://deno.com/)/TypeScript, and getting the nice JSX syntax configured made me feel confident enough to readd the feed. The XML emitted from my feed is not the best; I'd eventually like to roll my own Markdown parser so I have more control over the output, rewrite the `a href`s, etc.

First impressions of Deno: [slighly buggy in places](https://github.com/denoland/deno/issues/24900) but generally "just works" in a way I'm not used to from Javascript tooling. Decently quick. TypeScript is configured very strictly out of the box. I've really taken a liking to the language.

## Misc

My other TypeScript learning project is [daily-challenge](https://github.com/quat1024/daily-challenge), which accesses the osu! API and prints information about [the osu!lazer Daily Challenge](https://osu.ppy.sh/home/news/2024-07-25-introducing-daily-challenges). Also my first time working with online APIs, `fetch`, OAuth and such. I've been using it to (manually) populate [this OMDB list](https://omdb.nyahh.net/list/?id=140) of daily challenge maps.

I've set up [this page](https://highlysuspect.agency/exit-code-1/) you can send to people when they talk about "minecraft is crashing with exit code 1" instead of sending their logs. It contains instructions on how to find and share Minecraft logs in a handful of launchers. I'd like to add more launchers and better instructions.

To maintain *some* semblance of on-topic work, I'm working on a fast-and-parallelizable `.zip`/`.jar` reading and writing utility for Java, which I'd like to try turning into a fast jar remapper, maybe usable for Minecraft things.

## Personal

I guess these are the things I get up to when horrendously burned out of Minecraft? Pushing pixels around to feel productive while I further delay modding related responsibilities? I was really looking forward to the school semester being over so I could work on my projects, and now that it is over, instead I immediately felt horribly depressed, stayed in bed almost all day, etc. I'm frustrated with my output and I'm frustrated with myself.

To try and move forward, I signed out and deleted the bookmarks of most social media sites, since scrolling people's short-form thoughts was consuming way *way* more of my time than I am comfortable with.