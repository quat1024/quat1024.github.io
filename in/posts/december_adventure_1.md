slug=december_adventure_1
title=Blanksky
author=quat
created_date=Dec 01, 2024
---
*This is a [December Adventure](/posts/december_adventure_0/) post*

Today I worked on my Bluesky frontend called `blanksky`. It was rotting privately on my hard drive because I didn't have any way to persist the login session, so I just hardcoded my password into the source code. But now the authentication token is saved in `localStorage` so I think it's possible to [post it publicly](https://github.com/quat1024/blanksky). I revoked the app password just in case.

It's a single-page application written from scratch in Typescript, without React or other frontend frameworks. Shield your eyes, lower your expectations:

![very crude-looking bluesky client, interaction buttons are placeholders and it doesn't display images or anything](/img/blanksky/first.png)

## Build system

It's just built with `esbuild`. I rely on Visual Studio Code to perform typescript type checking.

esbuild is so fast that I don't need a fancy work-avoiding build system. Instead I use a [taskfile](https://github.com/adriancooney/Taskfile), which is a bash script containing useful functions and ending in `eval "$@"`. I think this will be my go-to task runner solution from now on (previously I was using `make` phony targets, which was somehow really slow).

## Context protocol

Everything is wrapped in a `<blanksky-account-context>` element. Any element can ask for the current account by bubbling up a DOM event that `<blanksky-account-context>`s listen to. Means I don't need to make the current account a global variable (thinking about how twitter.com refreshed the *entire page* when you switched accounts), but I also don't need to manually pass the current account down everywhere. Imagine two side-by-side timelines, each wrapped in their own `<blanksky-account-context>`. They should just "magically" attach themselves to the correct account.

A login form can be implemented by waiting for a "submit" click, asking for a *function* from `<blanksky-account-context>`, then calling the function with the appropriate credentials. That function mutates the account context. Then it's possible to remove the login form and place a timeline, and it will automatically find the account context. It feels kind of like object-oriented message passing. 

This context protocol might be useful for finer-grained context-passing, such as "like" buttons figuring out what post they're for. But the post element directly creates the "like button" element anyway, so it doesn't save much effort.

I learned this trick from [plainvanillaweb.com](https://plainvanillaweb.com/blog/articles/2024-10-07-needs-more-context/). My context API is missing the "subscribe to changes" feature, and I also use one DOM event per context type instead of putting everything on a single `context-request` event.

Modals will be difficult. Maybe listen for context events and proxy them onto another element deeper in the document.

I also think `Element.closest`, with some wrappers to make it reasonably typesafe, would be a good alternative to explore.

## Web components

I initially had functions like `createTimeline()` which returned an HTML element containing the user's timeline. But this doesn't mesh well with the context protocol, since if you're *returning* an element, your caller will be the one to *put* you on the document, so you're not *on* the document yet, so you can't fire DOM events, so you can't access the context API, so you don't know what posts to put on the timeline you're trying to create.

Initially I worked around this by passing a parent element as an argument to `createTimeline`, which sucked; then I tried a callback api where you could register a "do-later" function on an element, and after adding elements to the document you'd try and remember to call the "resolve all the do-later functions" function. This was also a mess.

So I started using web components. `connectedCallback` is the perfect function, since it's called after the element is added to the document and DOM events can be sent. I only use `customElements` and I don't bother with the Shadow DOM, so I kind of feel like I'm not "really" using web components. But plain HTML custom elements are my favorite part of that API anyway.

## Why not React or whatever

`bsky.app` is itself a React application, and it's plenty fast enough (at least, way faster than twitter ever was). Mastodon is a React application too. So why bother with this crap.

Partially because the performance will be more predictable. No reconciliation in sight.

I also wanted to learn about this style of web development. The tradeoff React makes is that writing programs in terms of DOM *manipulations* is too hard, so we should just give up and write programs in a fully declarative style. I don't know if this is the right abstraction. Maybe there is a better way to think about DOM transformations and we don't need to throw out the entire concept.

And it's fun.

## Look at it

[https://github.com/quat1024/blanksky](https://github.com/quat1024/blanksky).

## Will future December Adventure posts be this long

No

# Day 2

Not gonna make a whole new post for this but I changed the way posts look. More Mastodon-like layout, and uses CSS Grid to lay out the components instead of nested flexboxen so it's easy to change.

Identified some areas of future work:

* There's no "page stack" in the router. When you click onto a different SPA page it deletes the entire timeline, then navigating back requires reloading the timeline from scratch. Hmm.
  * I don't have any other pages implemented but I added a 404 link to user profiles
* The bluesky feed API returns replies to people you don't follow. These should be filtered out of the feed.
* I want a "pagination" interface instead of just rendering however many posts the feed API throws at me. Which of course means I need "previous" and "next" buttons, and on the timeline widget I need somewhere to store posts I've received from the API but haven't rendered yet + fire off more HTTP requests when the bucket empties.
* A lot of this stuff will be shared between general feed / user profile / specialty feed pages btw.