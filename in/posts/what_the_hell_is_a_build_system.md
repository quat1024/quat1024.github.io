slug=what_the_hell_is_a_build_system
title=What the hell is a good build system
author=quat
description=cause it sure as hell isn't Gradle
created_date=Sep 09, 2021
tags=mc-modding,design,java
subject=java
draft=true
---
Minecraft modding is in kind of a weird spot when it comes to build systems. It's a Java game, Java IDEs all have great integration with Gradle, and Gradle is pretty useful, so all the build tools are written as Gradle plugins.

The only problem is that Gradle is, well...

Loom [declares a bunch of Ivy repositories](https://github.com/FabricMC/fabric-loom/blob/2bc7522a260434abd308a4652c5db569a17f7c6a/src/main/java/net/fabricmc/loom/LoomRepositoryPlugin.java#L76-L86) for some reason, ForgeGradle leverages its library [Artifactural](https://github.com/MinecraftForge/Artifactural/tree/master) to do truly terrifying and fragile things to Gradle internals, I heard VanillaGradle may or may not be writing directly to the Gradle cache directory...

*Why?*

## Decompiling

I'm pretty sure most modern developments in Java decompilers have been pushed by Minecraft modders. We need to produce readable sources from messy .jars with most of the usable information stripped out.

## Recompiling

I'm not too familiar with what the Forge people are doing, but source-patches are still a big part of their toolchain. This requires pinning a specific version of a specific decompiler, applying a big pile of `.patch` files... Also decompilers aren't perfect so you need more patches to make the thing work again. And then you have to depend on the recompiled jar! Weee

## "binpatches"

Forge also uses binary `.class` -> `.class` patches somewhere in its toolchain, these need to be accounted for too.

## Access Transforming / Access Widening

Knocking off `private` modifiers from things, basically.

Needs runtime support through a classloader to do that during gameplay, and toolchain support so the compiler will let you compile against these formerly private fields, methods, and classes. If the pieces line up, it works flawlessly.

Oh, and don't forget reading the access transformers from your dependencies.

## Mappings

Mappings. They're a transformation from one namespace to another, defining what classes, methods, and fields should be renamed to, and sometimes some other goodies like method parameter names or Javadoc.

Field/method mapping sets include MCP and SRG (Forge's), Yarn and Intermediary (Fabric's), and Mojang's official mappings that they've started releasing since ~1.14ish (which Forge is sorta adopting). Naturally these are distributed in about twelve competing plaintext file formats.

Each mapping set has holes, and it'd be nice to stack mapping sets on top of each other. In particular, Mojang's mappings don't... provide the names of any method parameters, so there's a mapping set called Parchment out there that just provides those, so you can blend the two together.

Some of them are meant for players and modders to read and write, others exist for giving stablized names to everything in the game `.jar` (what is `method_47192`? I dunno, but it's whatever it was three versions ago)

If you've messed with ProGuard you might be familiar with the idea of deobfuscating a stack trace. Modding takes that idea about 25 steps farther.

## Binary Remapping

Minecraft .jars are distributed under one set of names, mods are developed under a second set, and players have a third set running in their JVMs.

This sounds like a great job for Gradle's "artifact transformers", but remapping uses both "a mappings file" as well as "an artifact to remap", and Gradle's artifact transformers are... one-to-one, for some bizarre reason? You can specify configuration for an artifact transformer task, but not in the form of other artifacts. (They're also [just plain buggy](https://github.com/gradle/gradle/issues/11519), being yet another thing Gradle people duct-taped on after the fact, instead of a well-incorporated architectural pattern.)

Remapping is not only useful for producing nice sources to look at, but it's critical that the released .jar is remapped appropriately, since players use the stablized-mappings.

## Source Remapping

So you can write a mod in MCP while depending on that other guy's mod using Mojang's mappings, or whatever, and it all works out. Especially handy for things like "go to definition" in IDEs.

This isn't a huge priority, but it's very nice-to-have. Can be implemented with either rudimentary find-and-replace or a Java parser.

I don't know if any tools provide this. Right now I live with messed-up names in my dependencies, I can check the decompiled version of the .jar to see working code and crossreference it with the original source to read comments. Not pretty!

## Sidedness

Minecraft comes in a playable client and headless server flavor. Each distribution contains only the classes it needs, like, the headless server doesn't include any of the rendering logic. It'd be nice to have our cake (write mods that include fancy rendering) and eat it too (have the mod not NoClassDefFound on a multiplayer server), and due to the decompilation toolchain telling us exactly which classes and methods are safe to refer to from which "side", we can.

(Mojang is easing up on stripping things out from the other .jar in 1.17, but it's still an issue; inherent to pretty much any multiplayer game with a dedicated server, really.)

## Downloading stuff

Gradle is great at downloading artifacts from Maven repositories, and a few other types of repository. Luckily, Mojang provides a Maven repository! It's not browsable, but it's at `libraries.minecraft.net`. Yay!

Unluckily, it only distributes dependencies, and the game itself does not have its .jars or dependencies in the Maven repo or indeed specified by any sort of Gradle-approved convention. [It's a JSON file](https://launchermeta.mojang.com/mc/game/version_manifest.json). Oops.

Also, the assets and sounds are downloaded through a completely separate system. Those are kind of important, too. Double oops.

And under Gradle, you can't define your own types of repository without hacking up the internals with a chainsaw. Not good.

## Launching the damn thing

Minecraft doesn't use a Launcher just for fun. It's anything but self-contained, and you need to specify a bunch of command line arguments for username/UUID/token, where the game should look for images and sounds, demo mode, where the game should put its save files, log4j configuration files (yes!), sometimes modloaders have their own command-line options...

## Java version

Recent versions of the game *only* open on Java 16 or greater. Older versions of the game work best on Java 8 or older. Some modloaders have their own requirements (Java 9's module system caused a lot of grief for the Forge people)

Some versions have a nasty bug where a faulty implementation of a sorting-comparator causes sorting to fail silently in Java 8 but hard-crash in Java 16.

You're gonna have to support both, if you care at all about historical versions.

## ok everyone just fuckin hates Gradle

It's slow, much too complicated, and is a duct-taped together tower of features instead of a strong flexible vision to be built off of. Bummer.

# Well, what else?

That's the thing. Gradle isn't really up to the task, but other build tools really *really* aren't up to the task:

There's a lot of "opinionated build systems" like Bazel and Meson floating around, usually geared towards building humongous codebases.

* Their Java integration usually consists of some kind of "compile_java" task that, while often very configurable, is not nearly configurable enough for our bizarro use-cases.
* They often assume that, apart from one or two tricky deps, everything is built from source, which we don't do. We don't "vendor" our dependencies either.
* They're built to be *extremely* fast, for multi-million-LoC codebases, and the user experience often suffers for it (i.e. you need to specify the dependencies for each individual Java file or package in the project, which is *way* too much for the sizes of codebase we work with)

Most build systems assume you have some other way of fetching your dependencies off the internet and don't help you with that task. Modding is firmly entrenched in the Maven ecosystem and we really need that, though.

Most build systems assume you're okay installing something new on your PC.

Some build systems pride themselves on having few side effects. This is all well and good, until you want to launch the game.

Gradle assumes that dependencies you download off the internet are already in some state of ready-to-goness, requiring wacky hacks when it's time to remap them.

Most build systems assume you have limitless space on your PC and it's okay if your project directory is used to store *all* the assets, even the ones that are the same across ten different projects you're making. (I really hate this one, lol)

Gradle multiproject *sucks* - I don't think it's Gradle's fault, really, just that the really bad plugins we have to use aren't great.

# What does Gradle get *right*?

My absolute favorite feature of Gradle is the "wrapper script", which is a small script you check in to VCS that downloads the real Gradle (pinned to whatever version you like) and uses that to do all the building tasks. This is very *very* nice, and not something I see in other build systems very often.

Gradle is fairly decent about "tasks with side effects". The task graph doesn't really depend on fragile things like file modification times.

While Gradle isn't the best about fetching dependencies from the internet, it at least *can*.

Many build systems work on the file-level, but Gradle's "artifact" analogy isn't a bad one, especially when binaries and sources typically need to move together and get affected by the same pipeline. These other systems also tend to tie tasks to files, assume that one task creates one file, or assume tasks create zero or one files but the zero-file ones are kinda special and it's okay if they act a little wonky. And I don't think Gradle has that issue.

# What is the ideal build system?

Now the fun part. :)

It should be written in Java. You're modding a Java game. Everyone will have Java. New versions of Java come with support for little single-file shebang scripts. Might be handy? You could write the wrapper script like that, or even the whole system, if you wanted.

I don't think Gradle's concept of a task graph is *that* terrible. It's mainly the inordinate amount of weird caching that goes on, and then cache*busting* that has to happen later as various plugins start having to hack around Gradle's idiosyncracies.

It's hard to organize all of the important dependency information.

* A remapped dependency depends on the original dependency and the mappings version. If *either* changes, the dependency needs to be rebuilt.
* Not all dependencies are project-specific, but the minute you add something like an access transformer or project-specific mapping set, the entire dependency now belongs to your project. Sort of?
* You might want to compile against a mod dependency that includes an access transformer. The dependency should always be applied at runtime, but at compile-time? Depends whether the dependency is supposed to be optional or not. I've been burned by accidentally taking advantage of an AT from something I thought was a soft dependency.

I was looking at the build tool `redo` earlier, and while it's definitely *much* more low-level than what I'm looking for, it has some very smart ideas:

* Instead of `make`, which compares the modification times of the source and target files to see if one should be rebuilt, `redo` takes a bunch of properties about the file (mtime, file size, inode, etc), throws them into a big soup, and if any of it changes it rebuilds everything that depended on that file.
* Unfortunately, it confuses tasks and files a little too much for my liking. Fortunately, it's not as weird as `make` about "phony" tasks, at least.