slug=where_has_all_the_memory_gone
title=Where has all the memory gone?
author=quat
description=Let's browse a Forge 1.18 modpack heap dump.
created_date=Oct 03, 2022
tags=mc-modding,forge,1.18
draft=true
---
It's no secret that modded Minecraft requires a ton of memory, and seems to require more and more over time. Questions about lag are often answered with "allocate more memory". But have you ever wondered what that memory is actually *used* for?

Luckily Java lets you take a "heap dump", which is pretty much a file containing every object that Java is currently managing. Tools like [VisualVM](https://visualvm.github.io/) allow easily capturing heap dumps with the press of a button and browsing every object inside.

Let's take a look, shall we?

## Modpack

The modpack chosen was [FTB Plexiglass Mountain](https://forum.feed-the-beast.com/threads/plexiglass-mountain-1-18-2.305588/) version 1.2.0 for Forge 1.18. I don't know much about this modpack, but it seems like a fairly typical modpack assembled by people who know what they're doing.

Its modlist is 238 mods strong and contains a good mix of little tweaks, big content mods, and a few optimization mods. Notable for our adventure is the inclusion of [FerriteCore](https://www.curseforge.com/minecraft/mc-mods/ferritecore), which is a mod that dramatically reduces the amount of memory the game consumes using [a number of methods](https://github.com/malte0811/FerriteCore/blob/main/summary.md).

TODO: Compare memory usage without FerriteCore (visualvm has a comparison tool)

## Scenario

I loaded the modpack, generated a new world with Creative mode enabled and a random seed (ended up being `-983888108176808920`), flew up into the sky and looked around to render all the chunks, waited for the framerate to stabilize, waited for a garbage collection cycle, then pressed VisualVM's heap dump button. I know that this isn't very scientific.

The only arguments passed were `-Xms8192m -Xmx8192m` (allocating 8gb of RAM) and other miscellany that the PolyMC launcher adds. The JVM is Eclipse Temurin 17.0.4-101, installed via `scoop`. I'm on Windows 10.

## Overall memory usage

8gb of RAM was allocated to the pack. After waiting for the garbage collection cycle, the game reported that only about 25% of this memory was in use, and the Java heap captured in the file confirms this, being only 2.03gb large. I'm guessing that the garbage collector could clear more memory if it wanted to but decided that 25% is good enough. I did not notice any framerate dip at all during this event.

## Single largest objects

In this section I will look at the largest *single* objects. This tends to point out the largest arrays and collections in the game (because the size of an array depends on how much stuff is inside of it). In Java, arrays to primitive types contain their elements inline, and arrays of nonprimitive types always consist of pointers to the objects. Pointers are 32 bits wide even on a 64-bit computer - the ["compressed oops" trick](https://www.baeldung.com/jvm-compressed-oops) - unless you are allocating more than 32gb to the game, which I am hoping nobody is doing.

The percentage is the total size of the used heap (the 2.03gb figure). When the data structure belongs to a collection, I've taken the liberty of looking for the things that reference the collection - it's less useful to say "there is a big hashmap" and more useful to talk about who references the big hashmap.

#### 1. `f_182324_ in net.minecraft.util.MemoryReserve`, `byte[]`, 10,485,776 B (0.5%)

The single largest object in the game, consuming 0.5% of the entire heap, is ten mebibytes of empty space not used for anything. It is entirely filled with zeroes. The game will free this memory if it detects it's dangerously low on memory.

I think this thing dates back to the applet days, too. Kinda funny.

#### 2. `_buffer in lzma.sdk.lz.OutWindow`, `byte[]`, 8,388,624 B (0.4%)

This looks like decompression guts - visual inspection shows it contains a bunch of fragments of jar files. It is a "GC root" meaning it will never b e garbage collected.

It is ultimately referenced by the `coder` field in one of [these classes](https://github.com/cstamas/streams/blob/master/src/main/java/org/cservenak/streams/CoderThread.java).

TODO: Who is loading this?

#### 3. `f_110877 in net.minecraft.client.renderer.block.BlockModelShaper`, `Object[]`, 4,194,320 B (0.2%)

This array has space for pointers to 1,048,576 `BlockState` objects. However, (according to VisualVM) it only contains 314,917 of them. This means that 2.9mb of the 4.1mb array is wasted. Why is that?

Java's only growable data structure is the array, so all other Java collections that use heap memory must ultimately reference an array. And sure enough, this array is referenced from an `IdentityHashMap`. There is wasted space in the array because the performance of inserting items into a `HashMap` suffers when the map is more full - `HashMap`s like to resize after reaching a certain fill level.

Resizing is typically done by doubling the size of the backing array - the idea is that resizing the array is a very expensive operation, so the amount of times the array is resized should grow with the *logarithm* of the amount of elements. With relatively small numbers of elements (say, in the four-digits), this is a great policy and strikes a good balance between "memory consumption" and "not getting any work done because the array is being resized all the time"

The interesting thing, though, is that there is no reason to accomodate for the performance of adding new items to the map, because at this point in the game's lifecycle we are all done adding things to the map. This only gets modified when loading resources, so there is no need for the extra space.

#### 4 and 5. `f_119960_ in net.minecraft.client.searchtree.SuffixArray`, 2,160,888 B (0.1%) each

The `SuffixArray` is a data structure used to accellerate searching for things in the vanilla recipe book.

There are two of them! I don't know why there are two `SuffixArray` instances.

TODO They both belong to `f_119944_ in net.minecraft.client.searchtree.SearchRegistry#1`

#### 6 and 7. ModelManager datastructures, 2,097,176 B (0.1%) each

One is the keys half, the other is the values half, of the same `ObjectToIntOpenHashMap`.

This is another map that contains every blockstate in the game, and it's another data structure that is oversized: there are 524,289 slots in the array but most of them are pointers to `null`. This is an `ObjectToIntOpenHashMap`, rather than a Java `HashMap`, so it has a different resizing policy - but you can see that 524,289 is one more than a power-of-two. So I imagine this is another map that doubles in size every time it grows.

# oh look its another draft post

I didn't finish the analysis, but it makes sense to post what I have instead of letting it rot on my hard drive

Want to be better about publishing more unfinished documents.