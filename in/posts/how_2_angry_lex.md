slug=how_2_angry_lex
title=how 2 angry lex.md
author=quat
description=Unfinished, short guide to setting up 1.12 coremods
created_date=Feb 6, 2020
tags=mc-modding,forge,1.12
subject=minecraft
---
This article was formerly published on my Github account [here](https://gist.github.com/quat1024/79f8083ae6a53f419033b11bbde78649/), although I never finished it. I've reprinted it on my new website as it originally appeared. Maybe I'll get around to finishing it someday, but unfortunately 1.12 modding is a little archaic these days and I'm mainly keeping it up for historical purposes only.

<hr class="cool"/>

Psst, hey kid, wanna write a coremod?

# What

Coremods allow you to define class transformers.

Whenever the game tries to load a class - *any* class, with few exceptions - all class transformers take turns stepping in and getting an opportunity to change the raw class bytes to *anything it wants*. This allows you to make changes to any class the game loads.

## What can they do?

You get one chance to change a class, just before it is loaded.

By "change", I mean you can really do almost anything you want to a class. You can add and remove methods, change access modifiers, change the class/interface hierarchy, change the code of methods, and so on.

## What can't they do?

You can't change classes *after* they're loaded. You only get the one chance, right before the class loads, and that's it. After the class loads, its implementation is finalized. (This is mostly a JVM limitation.)

Your class transformer *has* to return a valid class file. If the class file is not valid, the game crashes. If you don't return a class file, the game crashes.

### A warning

Class transformers are a double edged sword - one misstep can cause lots and lots of hard-to-debug errors. It takes practice and patience, and even then, issues can still be caused in production by forgetting to obfuscate a method name or other coremods changing the same classes in ways you didn't expect.

# How

## Manifest attributes

When Forge initially loads your mod, it checks `yourmod.jar/META-INF/MANIFEST.MF` for some information pertaining to coremods.

You must set the attribute `FMLCorePlugin` to the name of a class that implements `IFMLLoadingPlugin`. This is your entrypoint. (More on this in a bit.)

You also probably want to set the attribute `FMLCorePluginContainsFMLMod` to `true`. If you don't, Forge will skip your jar when looking for `@Mod` annotations.

Turns out looking in `MANIFEST.MF` is a pretty standard thing for Java programs to do, so Gradle has a convenient way of placing lines in this file so you don't need to do it yourself. Paste this incantation into your build.gradle:

```groovy
jar {
	manifest {
		attributes "FMLCorePlugin": "your.mod.package.core.LoadingPlugin"
		attributes "FMLCorePluginContainsFMLMod": true
	}
}
```

Finally, if you want your coremod to be loaded in development (which, of course you do), add the following JVM argument:

`-Dfml.coreMods.load=your.mod.package.core.LoadingPlugin`

I think `genIntellijRuns` sets this in your run configurations, but if it doesn't, paste that right into "VM options".

## `IFMLLoadingPlugin`

Back to that class the `FMLCorePlugin` attribute points to. It must implement `IFMLLoadingPlugin` and additionally it should have a few annotations:

* `@IFMLLoadingPlugin.Name` - a user-facing name for this coremod. It's that thing you see in crash reports.
* `@IFMLLoadingPlugin.MCVersion("1.12.2")` - For some reason you need to write the Minecraft version. Just do that.
* `@IFMLLoadingPlugin.TransformerExclusions` - an array of package prefixes that no class transformers will enter.
  * So, if you put `your.mod.package.secretstuff`, *no* class transformers will be able to edit, say, `your.mod.package.secretstuff.blahblah.MySecrets`.
  * The list is global to all coremods.
  * These classes will simply skip the coremod system, and appear in-game unmodified.
  * I **strongly recommend** putting your own core package in here (i.e. the package your `IFMLLoadingPlugin` sits inside). This prevents weird issues caused by trying to transform two classes at once.
* `@IFMLLoadingPlugin.SortingIndex` - Classes go through a chain of many transformers (other modded transformers, Forge/FML internal class transformers, etc) before getting loaded. They're sorted low to high, so transformers with a low number get first dibs on changing the class.
  * I **strongly recommend** putting in a number greater than 1000 if you plan to touch Minecraft code.
  * In production, Forge has a transformer at this sorting index that turns "proguard names" such as `h` into "SRG names" like `field_92587_d`.
  * You really really want to run after this transformer, because most mappings viewer tools work better with SRG names.

Oh, and as for the methods in `IFMLLoadingPlugin`?

* `getASMTransformerClass` is an array of class names that implement `IClassTransformer` (more on that in a bit, as usual)
* The other four can be safely ignored and left as no-ops or `return null`s:
  * `getModContainerClass` is "useful" if you want your coremod to appear in the in-game mods list as additional clutter next to your actual mod's entry.
  * `injectData` just gives you `Launch.blackboard`.
  * I don't know what `getSetupClass` and `getAccessTransformerClass` are for, but I have never needed to touch them.

### A note on classloading

Normally classloading is transparent - when you need a class, it gets loaded on demand. Coremods and class transformers break the illusion, however.

As such, you need to be *extremely careful* about what classes your coremod and class transformer access.

* Put your coremod related things into a separate package (convenionally, `your.mod.package.core` or `your.mod.package.asm`).
* Then, put this package in `TransformerExclusions` (above).
* Don't touch the things outside the coremod package from the coremod package.
  * Really, don't!
  * If you need to use something in your coremod, put it in your coremod package.
* Especially: Do not, **under any circumstances**, load classes from Minecraft from your LoadingPlugin or your class transformer.
  * Don't use `Class.forName` to refer to MC classes. Don't even use class literals like `BlockStone.class`.
  * Don't even look at Minecraft classes.
  * If you need to talk about a Minecraft class, hardcode its name as a string.
* Don't do anything overly "fancy".
  * If you use a personal library mod, it's tempting to use the utilities in that library mod in your coremod.
  * Avoid that - paste the utilities you need into a safe, `TransformerExclude`d location.
  * Remember that many "util" classes contain a bunch of unrelated things. When you use your util class, you might accidentally load something from Minecraft.
* It *is* safe to refer to things *inside* your coremod package from *outside* your coremod package.
  * If you need a shared resource, put it in the coremod package.

## `IClassTransformer`

This interface has only one method, `byte[] transform(String name, String transformedName, byte[] basicClass)`. Let's go through it.

* `name` is the name of the class as it exists on-disk.
* `transformedName` is whatever the *rename transformer* says the name is.
  * In development, these are always the same.
  * In production, `name` is a Proguardy thing like `a`, and `transformedName` is the same as it is in development.
  * TODO is that true :P
  * Basically: just use `transformedName`.
* `basicClass` is the byte array of the class file.

First, one small thing to note is that some class transformers return `null` when they error. Since transformers are all put together in a chain, someone else's transformer erroring can cause yours to `NullPointerException` if you try to work with the `basicClass` without checking. This can put your mod in the stacktrace for someone else's error! Always null-check `basicClass` and if it's null just pass the null down the line, not much else you can do.

Typically you only need to transform one or two classes with your transformer. Remember that transformers are called for literally every single class that gets loaded, so time is of the essence and memory allocations will get magnified.

Or, in other words, the first line of your class transformer should look like this:
```java
if(basicClass == null || !transformedName.equals("my.target.class.name")) return basicClass;
```
(or if you want to transform a bunch of classes, assuming `targets` is a very efficient collection like a tree or hashset):
```java
if(basicClass == null || !targets.contains(transformedName)) return basicClass;
```

Anyway, what about when `basicClass` is *not* null? Well... that's it. It's just a byte array.

Unfortunately this is where Forge stops helping. However, note that you get the ObjectWeb ASM library as one of the dependencies. This library takes you the rest of the way to your goal (and is why people colloquially refer to coremodding and class transforming as "asming".)

## ASM

**TODO: Write more.**

* "tree" and "node" APIs, everyone uses node because it's simpler, talk about performance tradeoff
* typical node API pattern

```java
ClassReader reader = new ClassReader(basicClass);
ClassNode node = new ClassNode(Opcodes.ASM5);
reader.accept(node, 0);

//do work

ClassWriter writer = new ClassWriter(flags) //talk about flags
node.accept(writer);
return writer.toByteArray();
```

* method naming/obfuscation
* jvm internals
* where to look for opcode references
* `Opcodes` interface
* 

# Debugging

* talk about CheckClassAdapter