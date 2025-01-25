slug=the_treadmill
title=The Treadmill
author=quat
description=When that thing you like slowly turns into a live-service game
created_date=May 11, 2023
tags=mc-modding
subject=minecraft
good=yes
---
For a while I've wanted to write a few thoughts on how the [post-"expect more changes in minor versions from now on" world](https://help.minecraft.net/hc/en-us/articles/9971900758413) is coming along, the gradual "live service-ification" of Java Edition, and how the modders are doing. This ended up being a loosely-categorized brain dump.

## Adversarial relationship?

I think Minecraft is overall a pretty good game. Modding is a form of [fanfiction](https://youtu.be/fX3w4hubVnQ?t=185) that I enjoy authoring. Mojang is a great development team with great people on it who work hard. This shouldn't be controversial. Yes, even the "mojang works hard" part, because they do.

I like Minecraft updates too. But every time I see a changelog, I read it just waiting to have a `We added a registry for Damage Types! (And therefore broke every mod that 'deals damage')`-shaped anvil fall on my head. I'm always looking at changelogs like "fuck, what did they break this time".

I especially don't like the "playing chicken with Mojang" game. Every time there's a new `1.X.Y`, there's murmurs in the modding spaces about "well, is this the final one?" "Is Mojang going to start work on `1.X + 1` now?" "Is this `1.X` version worth updating to?" If you updated your mod to 1.18.1, for example, congrats - you wasted your time, everyone plays on 1.18.2 now.

You have to understand that for players it's easy to choose 1.16 over 1.17 (or 1.19.2 over 1.19.4) because "the other version has no mods", but *we do not have that luxury when the new version comes out.* Modders can't predict the future, and don't have any more insights into Mojang's development timeline than you do.

## A snapshot by any other name.

What's the difference between a snapshot and a numbered release? Roll back the clock to when 1.16 was the new hotness:

* Mojang posts 1.16.0 and shortly after .1. The new Nether gets people very excited, so demand for mods materializes for this version.
* That version sticks around for a bit.
* While modders are porting away and a fledgling 1.16 scene is forming, Mojang decides now is the time to redo basically *all* the code relating to world generation.
* Mojang contains that code in a version labeled 1.16.2.
* All mods that did *anything* relating to worldgen are broken. All modloader APIs remotely related to worldgen are broken too because they were written against vanilla code that *does not exist anymore*. A big ecosystem-wide porting effort to create new APIs and fix mods commences, all while players are loudly wondering where the 1.16 mods went.
* The dust finally settles on 1.16.5, but many people who updated their worldgen mod to 1.16.0 or .1 feel like they wasted their time.
* Generally, much trust has been broken with Mojang.

Numbering a version is what *creates* the expectation of stability and support. The biome stuff is welcome, but dropping it in the middle of the 1.16 cycle is what created this mid-version hump everyone had to get over.

But it's purely a labelling problem - if the exact same 1.16.1 version was published as a snapshot for 1.17.0, fewer hearts would be tugged at.

## The old way versus the new way.

Here's roughly how I *think* development used to happen:

* Mojang publishes 1.9. Celebrating, champagne bottles, etc.
* The version having a "full release" labelling draws a large crowd, much larger than the snapshot-chasing community, so bugs are inevitably found.
* Mojang publishes 1.9.1, 1.9.2, etc to fix bugs.
* A fledgling modding community starts up.
* Eventually the dust settles on a "final" version of 1.9. A modding community begins to appear around it.
* Snapshots begin for Minecraft 1.10. Maybe the first couple snapshots add larger features, as long-running feature branches get merged.

Here's how I feel like things go now:

* Mojang publishes 1.19. Celebrating, champagne bottles, etc.
* Bugs start pouring in from the large crowd. Mojang throws a few feature-gated 1.20 things in while they're at it.
* Mojang publishes 1.19.1.
* Hey, I have this cool idea for "display entities", let's merge them in to the main branch.
* Mojang publishes 1.19.2 containing bugfixes, but also more feature-gated 1.20 prerelease stuff.
* Modders have no idea what is going on anymore. 1.19.2 lingers around for a while, mayyyybe it's the final 1.19 version?
* Meanwhile at Mojang, someone's like "oh right, we're working on datapack-addable blocks. This is going to require moving the Block registry. Let's do that now."
* Hey I think it'd be a good idea to use JOML instead of our in-house math library. No better time than today!
* Surprise!!! Mojang publishes a snapshot for 1.19.3 :) Turns out 1.19.2 wasn't the latest version after all and we didn't tell you!!! Pranked!!!
* Mojang publishes 1.19.3 containing bugfixes, but also ridiculous amounts of breaking changes
* Also let's rotate display entities 180 degrees because we got it wrong the first time, whoops

This model is a problem for mods because feature development is more "breaking" than bugfixes. Adding a feature will usually require more significant code changes (-> break mods more often) than fixing a bug will. Even if it's creative-only, or gated with their new bizarre datapack feature-gate system, it will require more significant code changes. Mojang's previous development model at least held-off on merging in these features until the dust settled on the current stable version.

In the previous development model, modstuff would start updating to the `1.x.0` release, but that version would ultimately be pretty similar to the final `1.x.4`, so early-updating work was generally pretty useful. Mojang would typically keep code changes to a number of small bugfixes. Do you remember that time when Forge 1.12.2 straight-up decided to [ignore "1.12.0 only" or "1.12.1 only" version-ranges on mods](https://github.com/MinecraftForge/MinecraftForge/blob/d3f01843f7e7a4f613b5e8113d381fd8747b4343/src/main/java/net/minecraftforge/fml/common/FMLModContainer.java#L261-L265) because 1.12.0 and 1.12.1 were similar enough to 1.12.2?

With the current development model, it feels like Mojang allows juuuust enough time between releases to allow a small modding community to form around them, and only *then* decides to dump a truckload of breaking changes onto people, containing *way* more than simple bugfixes. It's frustrating.

## The mod updating process just sucks.

Maybe it's true that *on paper*, following along with Mojang's treadmill version-by-version is easier than doing it in large chunks. But in practice - I need the "couple hours of free time" and "spare motivation" stars to be aligned, it takes forever for Gradle tooling to spin up to a new Minecraft version (*especially* on Forge), it takes time to get into the development groove, it takes time to test that the mod actually works, it takes time to write a changelog, it takes time to post the jars to CurseForge and Modrinth.

I've updated several small mods now where the process of just *waiting* on Gradle to load, and *waiting* for IntelliJ to index the new version of Minecraft, and hitting `runClient` and *waiting* for Minecraft to load, and clicking twice on the main menu and *waiting* to generate a world, has absolutely *dwarfed* - at least 10 to 1 - the time it takes to actually update and test the mod. It is demotivating. It's not fun!

(Then, of course, all that time becomes retroactively wasted when 1.18 comes out and not a single soul will download the 1.17 version of the mod ever again.)

## Version smear, and the efficacy of code.

I started writing mods around when 1.12 was the newest version. At that time, I think the most popular versions were one version that is "new" (1.12) and one version that is "old but people like the stuff available for it" (1.7.10).

These days the most popular versions are... I have no idea anymore. 1.16 still has a playerbase. 1.17 doesn't, but 1.18.2 is almost equally as popular as 16? A big modding community started around 1.19.2 before Mojang dedicded to kick it in the shins with .3, but the 1.19 playerbase ended up further divided into 1.19.2 players (which has more mods) and 1.19.4 players (which is the *actual* latest version). The old favorites 1.12 and 1.7 are also still hanging around; if anything they're picking *up* steam.

I don't know exactly what causes this - my hypothesis is that new players typically get into modded MC with the latest-and-greatest version, and stick with that version when time marches on - but whatever it is, the playerbase has been effectively *smeared* out over time, and has become more fragmented than it ever was before.

This is all independent of "mod loaders".

In 2019 it was easy to find motivation to mod: I could bang out some code against Minecraft 1.12.2 and throw it on CurseForge, where it'd reach around ~90% of players who wanted to play it. These days I feel like picking a version to use is just picking my poision. I don't have hard numbers but, including the effect of modloader wars, some days it feels like that "around 90%" figure has shrunk to 15%. There is no correct answer anymore. Whatever version you pick, you are going to get *tons* of hate mail complaining you picked the wrong one.

### I'm not even gonna bring up my modloader opinions.

I will say that it *really sucks* to be unable to take modloader services at face value anymore. I can't just "use something from the modloader"; I have to wrap the modloader's service in a little abstraction of my own creation, implement my abstraction twice for both modloaders, and use *that*. For everything. Inventories, custom models, *registering a block*, a config file, requires wrapping the modloader provided API. It is a ton of boring, mechanical glue code.

To a lesser extent this also applies to vanilla Minecraft services. Because I know Mojang habitually moves and breaks code, and I know that in six months there's a new version coming (with an X% chance of breaking something I used) and players are going to yell at me literally the *moment* it comes out, there is strong incentive to avoid utilizing Mojang's code as much as possible.

It sucks. It just fucking sucks. One of my tiny tweak mods [Auto Third Person](https://github.com/quat1024/AutoThirdPerson/tree/forge-1.12/src/main/java/quaternary/thirdpersonboat) was a fun weekend project entirely contained within one class but because I wanted to support more versions, the next version has metastasized to [*fifty five* classes](https://github.com/search?q=repo%3Aquat1024%2FAutoThirdPerson++language%3AJava&type=code). There's a "core" that does all the logic, then "xplat" which adheres it to vanilla minecraft, then finally a modloader-specific project that finally attaches it to modloader services, and basically the complexity of this project has shot through the roof because there's *two* layers of glue code between me and the modloader now.

Also I feel like this is partially what's driving the sort of... insularity, of mods these days?

* Config GUIs were easy when Forge 1.12 was king, but now they're a pain in the ass - both because Forge no longer ships one *specifically because updating it to newer versions was a massive maintenance burden*, and because interacting with the Forge config API at all now requires modloader shim-glue if you don't want to get 'fabric pls' comments immediately after posting the mod - so mods just... generally don't include config GUIs anymore.
* Using modloader services is now much harder (because you need to write modloader glue). It's often easier to completely reimplement things in-house... which means they're probably not interchangable with the stuff from the modloader.
* Same for vanilla services. Why bother with the vanilla `Registry` class if Mojang is just going to break it again? Might as well use a `Map<String, T>`.
* The "nice-to-haves" are the first to go. It's no longer easy to make a quick custom-item model to add a bit of pizzazz - way more hassle than it was. But plain json models work fine. It'd be nice to add a deep, meaningful mod integration but I am so busy running this treadmill that I don't have time.

## I can't really fault players?

So a lot of the above text has been predicated on "making the annoying people who leave driveby '1.16.5 fabric pls' comments folks happy". I was asked - why do I care about these people? It's very easy for me to say "no, I'm not porting to Whatzitloader for version 40w81a, leave me alone" or "no, 1.16.5 is unmaintained, I will not fix it". Many well-respected modders do just that.

The thing is that I *understand* where these annoying people are coming from. It is very natural to be frustrated by finding a mod that looks fun, then finding a largely arbitrary version-number barrier or modloader barrier has been put between you and your ability to drop it into your modpack. I think it's frustrating too and I don't *like* saying no to port requests. I'm working on a new mod that's currently just for Fabric, and I haven't done that because I think annoying Forge players is funny, I've done that because I have to start modding *some*where.

But also, people don't just "want a port of the mod for 1.19.2", they want a polished, complete, *working* port of the mod for 1.19.2, and they want support when it breaks, and they maybe want a trickle of updates and bugfixes over the coming months, and they want some integrations with other mods available for the platform. The "copypaste the codebase into a new branch, fix it until it compiles against the new version"-method of porting a mod just creates more problems for me down the line when it's 2 weeks later and someone wants a bugfix for the previous version.

## Breaking changes.

The term "breaking change" in the software-development, technical sense of the word doesn't carry any implication of whether the change is good or bad - it just means that the change is not isolated, and will require unrelated bits of code to change too.

Minecraft (in?)famously doesn't have an official modding API besides datapacks. Minecraft is simply a game written in Java; mods are written directly against the Java code, sometimes modloader tricks are employed to directly edit bits of vanilla code to accomplish their goals. As far as mods are concerned, Minecraft has no safely-encapsulated "implementation details" whatsoever - there is no "public API" for mods to use and a "private API" that Mojang can change without breaking any mods.

So in effect, practically *anything Mojang changes at all* becomes a "breaking change".

* Mojang moves a `public static` field from class A to class B? Breaking change, even though the function of the code and the purpose of the field is the same.
* Mojang changed the constructor for `BlockEntity` to take a `BlockPos` and `BlockState` instead of using a setter to set them after construction? Breaking change, even though only vanilla engine code ever needs to construct BlockEntities.
* Mojang made ticking block entities receive their ticker from the `Block` instead of from an interface on `BlockEntity`? Clearly a breaking change, even though it helps improve performance and cool off unnecessarily-ticking BEs.
* Mojang made [resource loading multithreaded](https://highlysuspect.agency/posts/we_out_here_reloadin/)? Definitely a breaking change because "adding multithreading" requires a complete rearchitecture; turns out "threads" are not magic sauce you sprinkle on things to make them fast.
* (vintage 1.5 example) Mojang added their first redstone power source that could output redstone signals other than exactly 0 or exactly 15? Breaking change - they flipped a `boolean`-returning method to an `int`-returning one.

I can do this all day. The player-visible effects are often unnoticeable, but each of these changes required mods to update to the new system. Even in cases where the update is easy, like a `public static` field being moved, it still means mods written for 1.19.2 crash unless modified to refer to the field using 1.19.3's location, and there's no way to write one codebase that compiles on both versions. Maintaining two versions in parallel is always going to require some version-specific copy of the codebase or at least version-specific glue.

### Adding the new requires removing the old.

You have to realize that modded players are like, (small number)% of the target market, by the way. I don't want "modders will complain if we make this change that uncontroversially improves the game engine!!!! It will break their mods!!!" to hamstring the development of my favorite game for everyone *else* who plays it. Mojang can't and shouldn't carry irrelevant dead-weight code forever just to keep modders happy.

I got into this game from vanilla and there's a whole new generation of players getting into the game through vanilla - if vanilla needs to be made better, vanilla *should* be made better. I want to stress that the term "breaking change" still doesn't imply anything good or bad.

## An "official API".

You don't want an official modding API.

Minecraft mods can add wholly new varieties of content, explore very fancy graphics and custom GUIs, overhaul the entire game in new and unexplored directions, and do Anything you can imagine. This is the stuff people *like* about Minecraft mods, this is what draws people to Minecraft mods instead of Factorio mods, and it's all stuff you simply *can't do* if you are limited to an official API because **an official API can only do officially-supported things.** With an official API you can only expand the game in ways Mojang *says* you can expand it. There is no way in hell you'd be able to make a mod like Create.

What about the language? If the modding API is written in, say, Lua, you run into the same problem, where you can only interact with the code of the game through the specific parts the game officially makes available to external code. In order to do the things users expect modding to do, the modding API must be written in Java and load Java mods. And now, recall that piles of arbitrary Java code can, well, display rickrolls, download files and save them onto disk, mine bitcoin, upload your Minecraft session token, install viruses and backdoors and keyloggers, and generally "do things that every computer program can do", because Java programs are... computer programs.

I do not think Mojang would be willing to front all of that risk by *officially* signing off on a modloader written in Java. For better or for worse, mods will always remain some degree of unsupported and underground. (It's for better.)

## Datapacks are a fiction.

Over the past 150 million years, Mojang has been making the game more "data driven". Examples of this include removing numeric block IDs, changing recipes from being hardcoded in Java to being loaded from json, changing models from being hardcoded in Java to being loaded from json too, moving biomes and structure stuff to json, changing some hardcoded behaviors to tags when possible (like `minecraft:enderman_holdable`). Json json json.

That's great, but games are written in code, not JSON. The only thing a json file can do is select between existing bits of code already in the game. You can add "new content" with json files, and that's great, but you can't add new *kinds* of content.

I bring this up because I feel like there's a "mojang is making it easier for them to add new content to the game engine" sentiment. This is true, but unless Minecraft 1.25 is an update that simply adds new shipments of blocks, they will also need to add new *kinds* of content too. So code changes will always be necessary.

## "Version numbers" as "advertisements".

There's a concept in software development called ["semantic versioning"](https://semver.org/), where you have a three-pronged version number (like "2.5.3") and name the components "major", "minor", and "patch" versions. You bump the patch version whenever you fix a bug, you bump the minor version whenever you add something new, and you bump the major version when you make *any* breaking change at all. It's "semantic" because the way the verison number is changed carries meaning.

This is very different from how version numbers get used *in popular culture*. With Minecraft, its version always starts with 1, the second number is mostly a marketing tool, and the third number carries no information whatsoever about the amount of breaking changes in the version (see: 1.16.2, 1.19.3). If Minecraft followed semantic versioning to the letter we'd be on like Minecraft 91846.0.1 by now.

## Live-servicification, accelerating development pace.

I want to blame the "live-service" model for getting people used to the idea that a game is dead and worthless if it hasn't been updated with Content in like, a month. Can Minecraft ever be *feature-complete*?

Minecraft is a game about using your imagination, building things never thought possible, going on Minecraftforum and shooting the shit on people's adventure maps. This is a game about *our* creativity, why is it *Mojang's* job to spoonfeed us new content? I like [this little corner of twitter](https://twitter.com/JasperBoerstra/status/1655723240516362241) where JAPPA engaged with a few of the "minecraft needs more weapons and bosses!!!" kids and tried to figure out what they really want. If you treat Minecraft like a little box where new Content to Consume is added every couple weeks and there's always a surprise around every corner, of course you're going to be disappointed, and adding a boss and 2 swords is not going to help. (A couple people in that thread already seemingly forgot the Warden was added.)

It's no secret that Minecraft is trying to shed its reputation of being slow-to-develop. I think this is partially what's driving the recent "we need to release 1.19.3 and 1.19.4 versions containing a bunch of half-finished stuff and previews for 1.20!" push. People want to see the version number go up, and airdropping random half-tested features in numbered versions means you can bump the version number more often, because the version number is marketing.

I just... really dislike modders being tasked with picking up the pieces here. I wish there was a way to make the people whining about Minecraft not being updated for 5 nanoseconds shut up, using a way other than "breaking mods every single version".

## Just plain entitlement.

come on guys, I don't remember *this* many people in the comments section literally *the day-of* a new release wondering where the download is.

I feel like mod questions on /r/feedthebeast have slowly gotten more and more demanding, going from "what are some cool magic mods for 1.12 to try?" to "is there a mod adding EnderIO travel staff for 1.16" to "give me a mod that adds themed items and blocks obtainable exclusively through dungeon chests and I'm ONLY interested in 1.17.2 Fabric". I've also seen people ask for competely ridiculous version support, like "outdated versions of 1.16 (while the latest mc version is 1.19)" and "April Fools snapshots". Always thinking about the dude who showed up in my discord, asked a question, then left in a huff when I didn't answer within 5 minutes - I was taking a walk outside.

This has to be a new thing, right.

## While I'm on my soapbox:

Fucking sick of people insinuating modders "fix" Mojang's game. I'm talking about the players who praise modders with one side of their mouth and deride Mojang for producing lazy updates modders need to "fix" with the other. Modders are not your wedge! If you hate Mojang's updates so much, why does everyone want mods to be updated to them lmao?

And honestly even if "people wanting mods on 1.19.4" and "people loudly whinging about 1.19 being a shitty update" are wholly disparate groups of people (which I'm not convinced they are), modders still get the exciting job of "being stuck in the middle of them".

# FAQ.

> Why doesn't everyone just play Minecraft 1.-

So I made a tweet joking about how I bet there's gonna be 1.20.0, and a 1.20.1 that breaks mods, and a 1.20.2 that breaks mods again, and a 1.20.3 that somehow removes `ItemStack` and *turbo* breaks mods. I've since deleted the post (too whiny!) but those jokers over at Modrinth retweeted it first, so I very quickly got three responses of the form "I agree! Updating to newer versions is annoying. It'd be so much better if everyone played on version 1.xyz.".

All three people suggested different versions.

> Modloader wars are annoying, why doesn't everyone just use F-

Turns out there's good reasons to use both modloaders, they both cover areas the other one doesn't, they are developed with different goals, you can't "just run Forge mods on Fabric" because the code of Forge mods expects a massive amount of patches to have been made to the game, and you can't "just run Fabric mods on Forge" because the event systems don't line up and Forge's patches decided to change the signatures and semantics of a lot of the methods that Fabric mods target.

This idea is hardly new or original - Modders are *very much aware* of the modloader split. If it was possible, someone would have done it by now. There is no Easter Bunny, there is no Tooth Fairy, and there is no program to open Fabric mods on Forge. Sorry.

> Can someone write a program that allows loading `1.a` mods on `1.b`?

For simple cases ("mojang moved a thing, but it works the same"), possibly - you all remember [CompatLayer](https://legacy.curseforge.com/minecraft/mc-mods/compatlayer) from the 1.11 days, right? For anything more complex: No. And Mojang's updates have only been getting more and more complex as time goes on.

If the `1.b` in question is "the latest version", by the time this hypothetical program was finished, Mojang will have posted `1.j`. While back I remember brainstorming a tool to load 1.7 mods on the then-current version; thinking about how i could jokingly call it a "version doubler" because it'd load 1.7 mods on... 1.14. Yeah.

> If we can't have an official API, why doesn't someone make a modloader that doesn't directly expose any Minecraft code, as a compromise?

This is called Bukkit. Its functionality is limited, updating it is very hard, it is collapsing under the weight of its own legacy code, and it's basically impossible to write "bukkit that also covers the clientside" in any remotely flexible way. Turns out that modloaders aren't magic!

A shim that doesn't allow access to the real game is inherently less powerful.

> Could Mojang make an official modding API in Java if they sandboxed it?

Sandboxing Java is like mopping up rain. For an overview of the state of sandboxing Java code, please consider the article [Twenty Years of Escaping the Java Sandbox](https://www.exploit-db.com/papers/45517); actually just reading the title is fine. That's about escaping the SecurityManager, which is now slated for removal because it frankly didn't work. Official sandboxing advice is now ["iunno, use a virtual machine?"](https://inside.java/2021/04/23/security-and-sandboxing-post-securitymanager/).