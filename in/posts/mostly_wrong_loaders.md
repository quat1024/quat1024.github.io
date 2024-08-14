slug=mostly_wrong_history_of_modloaders
title=A brief, incomplete, and mostly wrong history of modloaders
author=quat
description=From base-class edits to Launchwrapper and beyond.
created_date=Aug 13, 2024
subject=minecraft
draft=true
---
Minecraft modloaders are complex pieces of software. Every so often someone will ask "how do modloaders like Minecraft Forge work?". The short answer is "it's winding, complex, and there's a lot of historical baggage involved".

This document is an attempt at the long answer.

> It is also *literally* incomplete. I want this page to be a more organized, clearer, better-researched version of [my reddit comment](https://www.reddit.com/r/feedthebeast/comments/1ere8ru/how_do_mod_loaders_like_forge_actually_work/lhznqzh/) but I'm not done writing everything out yet.
> 
> ![](/img/cons/construction.gif)

## Jarmodding

From the top. Alpha/beta Minecraft. September 2010.

Java applications, including Minecraft, are often distributed in `.jar` files. Jars are simply renamed `.zip` files, and each `.class` file inside is a compiled fragment of code.

People pretty quickly figured out that you can extract the jar with any zip program, use a decompiler like [JAD](http://www.javadecompilers.com/jad) to decompile it into editable `.java` files, hack at the code, and recompile it with the standard Java compiler. You can then share your changes, often by zipping up only the classes that you changed (to try and avoid redistributing the *whole* game, which would certainly catch the eye of Mojang's legal team).

Users installed these mods by opening the Minecraft jar and pasting in the modified classes. Since this broke all of Mojang's digital signatures, users would then delete the `META-INF` directory, which deleted the digital signatures.

One of the first mods created in this way is [hMod](https://github.com/traitor/Minecraft-Server-Mod) in [September 2010](https://github.com/traitor/Minecraft-Server-Mod/commit/6315f5aa834a9f0dac9a99d45e4e65af56d1d227#diff-e5c07a69a1bd7ab7e1dd90849d34bbe51894222b3344e56335fe69001219ab3b).

## MCP

Jarmodding is fickle to set up. If you decompiled a class that linked against one of Minecraft's many third-party libraries, you'd have to obtain a copy of that library and put it on the compilation classpath to successfully recompile your mod. Additionally, decompilers are not perfect, especially the old ones like JAD. Sometimes decompiler output did not actually recompile, sometimes the decompiler introduced logic bugs. Manual fixup was required.

However, the biggest problem was that the decompilation process did not produce readable code. Mojang ran the ProGuard obfuscator on the Minecraft jar before releasing it, renaming every class, field, and method to short one- or two-letter names. This reduced Minecraft's file size but made it very hard to tell what was happening in the code.

This is the context in which MCP was created in [October 2010](https://web.archive.org/web/20131231043950/http://www.minecraftforum.net/topic/54719-toolkit-mod-coder-pack-mcp/). The Mod Coder Pack is a pile of Python 2 scripts that *deobfuscates* the Minecraft jar using a manually reverse-engineered set of mappings, renaming every class, field, and method to something more user-friendly. It then decompiles the remapped jar with JAD (and later, early versions of Fernflower), applies any necessary decompiler-fix patches, formats the code, procures all necessary third-party libraries, and sets up an Eclipse workspace for you to start hacking on your mod, complete with a small wrapper class to allow launching the game directly from Eclipse.

When you were done, more Python scripts would recompile your mod, detect which classes you changed, and produce a zip containing only those classes, *reobfuscated* to ProGuarded-names, ready to distribute to players and paste into their ProGuarded Minecraft jars.

These days, MCP is mainly known for its mapping set. MCP first remapped all field and method names to unique identifiers (`func_12345_a` and such) before remapping them again to human-readable identifiers, which allowed mods to remain compatible with each other even though field and method names were crowdsourced over IRC as modders untangled Minecraft's code and debated the best naming conventions. MCP mappings were placed under a somewhat restrictive license, as an effort to avoid proliferation of mutually incompatible mapping sets. Anyone was free to use the unmodified mappings for their mods.

## bukkit

todo research this more. bukkit plugins were probably the first "mod loader".

## Risugami's Modloader

As Minecraft modding grew in popularity, a new problem with jarmods started revealing itself. Jarmod class overwrites are a sledgehamer; only one mod can overwrite a class at a time. If mod A adds a method to `abc.class`, and mod B adds a different method to `abc.class`, whoever wins will depend on the order the user pastes mod A and mod B into their jar. If both of those patches are necessary: those mods can't be installed at the same time, tough luck.

Risugami's ModLoader brought two innovations to the table. Instead of adding your mods directly to the Minecraft jar, ModLoader would search for mods in a special `./mods` directory and stick them on the classpath. Then, ModLoader would cover all the base-class editing *for* you. Instead of hardcoding mod functionality directly into the Minecraft code, ModLoader's patches would ask the list of loaded mods "what do *you* want to do?". This allowed several mods to add their own furnace fuels without having to fight over who gets to modify the furnace class, for example.

Risugami created his ModLoader largely to make his own mods compatible with each other, but was happy to allow the community to use it for theirs. ModLoader's base-class edits targeted many frequently-patched areas of the code, so when modders started using ModLoader hooks instead of making their own base-class edits, it started to become possible to install more and more mods at the same time without conflicts.

Importantly, using ModLoader did not preclude using other jarmods. Some jarmods didn't touch any ModLoader-patched classes and were compatible out of the box. Others installed ModLoader into their game *before* decompiling it, so their base-class edits would also contain the ModLoader patches.

There was also ModLoaderMP, which created a ModLoader-like interface that allowed authoring multiplayer-compatible mods. (I think Risugami himself was largely interested in singleplayer.)

## Forge (Minecraft Beta/1.0)

ModLoader's "one jarmod to rule them all" approach calmed the compatibility nightmare for a while. But [as the creativity of modders started to grow outside of ModLoader's confines](https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/minecraft-mods/1275635-api-minecraft-forge?page=6#c144), even ModLoader-compatible mods shipped more and more base-class edits, and the compatibility problem reared its head once again.

Mods that added fluid mechanics frequently needed to patch the bucket right-click code. Mods that added mineable blocks frequently needed to patch the pickaxe code so the pickaxe would harvest them faster, or patch block-drop code if they had any nontrivial behavior when mining. *The same class conflicts were coming up over and over again.*

In July 2011, several modders (including Eloraam, the author of RedPower, and SpaceToad, the author of Buildcraft) got together and decided enough was enough. They pooled the most important base-class edits from their mods together, decoupling them from their mods and phrasing them into reusable APIs, with the goal of creating a second "jarmod to rule them all" and eliminate the need for mods to keep fighting over the same classes. The resulting patchset was given the name "the Minecraft Forge".

The Forge was a "standard library". Users would install ModLoader to obtain a mod loader and one set of patches, then install the Minecraft Forge for an extended set of patches, and then install their favorite mods on top. Early versions of the Forge did not include any modloader functionality.

A porting effort swept the Minecraft forums. Since the Forge now needed to patch all these hotly-contested classes, modders who also patched those classes would need to remove it and rewrite using the hooks the Forge added if they wanted their mod to be compatible. If that wasn't possible, the Forge project openly solicited opinions about how to improve its patchset on its forum thread. [They were serious about mod compatibility](https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/minecraft-mods/1275635-api-minecraft-forge?page=12#c302).

Yes, it was frequently called "the Forge", with an article.

# Stay Tuned ![](/img/cons/dukeconstruction.gif)

for the exciting conclusion of the story

![](/img/cons/construction.gif)

<!--

## FML (1.2-ish)

it's a replacement for modloader and modloadermp but todo figure out *precisely* why they decided to start this project. surely it's buried on a forum thread somewhere.

fml is also where "coremods" started, i think. the system is there in 1.4 (the "relauncher", relaunchclassloader, etc), and the system was totally yoinked for launchwrapper. was it there earlier?

## Launchwrapper (1.6)

problem with forge: copyright. with jarmodding, if you change 1% of a class, you have to redistribute the other 99% of it. forge (by its nature as "the one true jarmod") added teeny tiny patches to dozens of minecraft classes

around the same time mojang was rolling out LegacyLauncher / Launchwrapper

## Liteloader (1.8)

yep. mixin started from this

## Sponge (1.8)

popularized mixin

## Fabric (1.13)

modding toolchain completely free from base-class edits. i'm pretty sure it started just to prove it could be done, and mixin was the missing piece required to get everything to work.

1.13 is a lie but that's when it became popular

prospector's oral history of fabric https://gist.github.com/williambl/c143c7f89cc55bdf9cff06b5bc49f915

yarn

## Forge, again (1.16)

fabric made mixin *extremely* popular, Forge eventually added it to their loader to placate everyone + fix people shipping 15 copies of mixin with their mod

mention the official mappings

## MixinExtras

and the wheel turns once more!

### things i should fit into the timeline!

* the release dates of minecraft
* MCPatcher, Magic Launcher
* maybe rift and stuff

-->

# Sources

* This section of the LiteLoader wiki: https://www.liteloader.com/explore/docs/info
* The original Minecraft Forge forum thread: https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/minecraft-mods/1275635-api-minecraft-forge. It's probably best to browse this with the Wayback Machine as many posts are missing now.