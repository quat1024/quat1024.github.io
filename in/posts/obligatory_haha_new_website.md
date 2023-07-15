slug=obligatory_haha_new_website
title=Obligatory Haha New Website Post
author=quat
description=What I learned making this new site!
created_date=Mar 16, 2021
tags=rust,design
draft=true
---
So uh, hi, this is my new website! Fancy that, huh.

It doesn't look too much different than my old one, apart from the inverted color scheme (light mode, heyo), but behind the scenes it's no longer a static site, and is using a backend hastily thrown together in Rust. This post intends to collect some of my thoughts on what the process of making it was like, lessons learned, etc.

## Design

"Readability" is a nebulous concept that's tricky to nail down, small changes can drastically impact the readability. I find it hard to read lots and lots of text off a computer screen, which is why I went for a bigger font, and I found the white-on-black text of my old site easy to read in short bursts but reading an entire article like that was difficult. Luckily I had kept all (okay, most) of the CSS color information in variables, so switching to "light mode" was a painless process.

The background color is an off-white that's tinted slightly red, which is a bit easier on the eyes than full-blown white.

I actually didn't intend to create the "redacted document" look, with the black links looking a bit like crossed-out text from a distance, but it works and I guess it fits this ridiculous domain name.

And I had a lot of fun designing [the 404 page](/missing). It uses a bunch of `text-shadow` and `clip-path` shenanigans.

## Meta

Motivation was a struggle. I have trouble staying motivated on things long-term unless I get a burst of energy to work on them, and this project was no exception; a lot of the work happened in the first day or two then I burned out a little.

Part of why staying motivated is hard is like, I haven't blogged in over a year, so why bother making a new website to show off all my old Minecraft modding posts with now-outdated info, right? There was kind of a chicken-and-egg problem there - I've wanted to scrape together things like a modding tutorial, but I didn't want to blog because I didn't have a blog to put the posts on. We'll see what happens.

## Tech

(why you're probably here)

### Stack

Well, first of all, here's the [source code](https://github.com/quat1024/quatweb) to my server.

The server itself is running on a tiny VPS loaned to me from a friend. Thanks, una!

> una your "very tiny container" with half as many vcpus as my computer's actual cpus, can compile rust twice as fast as my computer

On the software side,

* I use `warp` to serve the document. It's not behind any reverse proxies like `nginx` or anything, but I might change that.
* HTML templating is currently done with `ramhorns` and Markdown parsing is done with `pulldown-cmark`.
* Logging uses `pretty-env-logger`.
* Configuration is provided through environment variables using `envy`.
* Uhh, some other stuff too.

I'm actually quite surprised at how many transitive dependencies this thing has - over 200.

It's kind of a "static site", but also kind of not. A lot of things are cached, like the rendered-markdown of posts, and it basically just puzzles templates together for every pageload. There's a way to force it to reload those caches through stdin. I could make this into a static site but I'm stubborn (and I have some ideas for later.)

### Soooo what was it like to develop the thing

I dunno, I have some thoughts on this, lol. I also want to stress that this section is **from a newcomer's perspective** and there are probably solutions to many of these problems.

So my primary experience with Rust is that, when the fancy things work, they work beautifully, but when they don't, it's ugly.

* Parsing my `Settings` struct out of an environment variable with `serde` and `envy` was very fun and easy, so next I moved to switching the frontmatter parser for my blogposts from a handrolled `=`-splitter to something like HJSON or TOML using those libraries. I don't remember the exact problems I had but they simply did not work.
* Telling the server to dump its caches through `stdin` is great but it'd be even better if it happened automatically when I changed a file (like a blogpost or mustache template) that required dumping the cache. So I tried `notify`, version 5. It did... nothing.
* I tried `color-eyre` because I heard it had nice error reports. I had a lot of fun decorating my errors with the appropriate context information - finally, I can tell myself which post failed to parse, instead of an opaque "missing created_date" message... Then I tried `println!`ing the error and hardly any information showed up. Maybe I misused it, or maybe the fancy error messages with context only appear when printed through the panic handler? Who's to say.

#### async

The `async` situation is Rust is very rough around the edges. The standard library provides very little and most of the Fun work is pushed off to libraries like `tokio`, which (for example) offers you nice fancy async Channels! ...that are not compatible with ones from the standard library, or any projects that use the ones from the standard library. "Colored functions" (weird name, don't like it, it's what stuck) strike again. That's why I couldn't try `notify` version 4; it uses a standard library `mpsc::channel` and I really wanted to `await` on its output but I could not figure out how the hell to do that.

Like I guess spinning up another OS thread isn't the end of the world but it feels like I shouldn't have to do that.

My other complaint with `Future`s is the only "easy" thing to do with them is `.await`ing their output. Futures are ostensibly an abstraction over "a value that might not be present", so it's surprising there are no `isDone() -> bool` or `get() -> Option<T>` functions, right? The method you *do* get is `poll`, but calling that is a job for the async runtime, not you. People have written [toy executors that spinlock while waiting for the task to complete](https://crates.io/crates/spin_on) and it's like a page of code, which isn't that much in the grand scheme of things but it's a surprising amount of code for "thing that makes the code run", right? Compare to something like Java where `Runnable::run` is a valid implementation of `Executor`.

I digress. Maybe having a more complex `async` interface that favors scaling up to real-world executors like `tokio`, instead of scaling down to easy-to-write but hilariously inefficient toy executors like `spin-on`, is a good thing actually.

Also, while the idea of having "multiple executor backends to choose from while everything stabilizes" sounds good in theory I suppose, in practice you are tied to one because a dependency is. I tried switching to `smol` and, well it's kind of pointless because I already use `warp` which depends on `tokio`, so unless I want two executors in my binary for whatever reason...?

## Conclusion

Idk uhh. Rust is cool and this post would be more positive except I don't remember the parts that go very smoothly and I only remember the sticky bits. You know how it is.

This is like a half-formed thought turned blogpost, sorry about that lmao