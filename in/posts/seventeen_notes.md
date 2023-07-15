slug=one_point_seventeen_notes
title=Updating to Fabric 1.17 notes
author=quat
description=Aggregated notes on updating mods to Fabric 1.17
created_date=Jun 08, 2021
tags=mc-modding,fabric,1.17
---
Let's get right into it:

# part 1: Updating to Java 16

Minecraft 1.17 runs on Java 16, and it's in your best interest to get everything on the Java 16 boat as soon as you can.

Quick checklist for IDEA users:

* Ensure the `JAVA_HOME` environment variable points to a valid Java 16 installation.
* Use at least Gradle version 7.0.2. You can see my previous blogpost for instructions on how to update the hard way, or update the easy way by changing the number in `distributionUrl` of `gradle/wrapper/gradle-wrapper.properties` to `7.0.2`.
* File -> Project Structure -> Project: set `Project SDK` to 16, and `Language Level` to "SDK default" (top of the list).
* File -> Settings -> Build, Execution Deployment -> Build Tools -> Gradle: ensure `Gradle JVM` is "SDK default".
* In your run configurations, ensure that you're gonna run the game with Java 16.

## Buildscript

I'm going to assume your buildscript is shaped after the one in fabric-example-mod, and that you didn't tweak it toooooo too much.

### Preparing for Java 16

If you have a `sourceCompatibility` and `targetCompatibilty` setting at the top, change them to `16` or `JavaVersion.VERSION_16`.

The `tasks.withType(JavaCompile).configureEach` block, present in somewhat recently-cloned `fabric-example-mod`s has this block:
```groovy
// The Minecraft launcher currently installs Java 8 for users, so your mod probably wants to target Java 8 too
// JDK 9 introduced a new way of specifying this that will make sure no newer classes or methods are used.
// We'll use that if it's available, but otherwise we'll use the older option.
def targetVersion = 8
if (JavaVersion.current().isJava9Compatible()) {
	 it.options.release = targetVersion
}
```
This is obviously not relevant anymore, and can be erased.

### Making things work on Gradle 7

* Open `settings.gradle` and make sure things are using `https`.

* Find-replace `modCompile` with `modImplementation`.

Finally, to fix the `build` task, change this:
```groovy
from(sourceSets.main.resources.srcDirs) {
	include "fabric.mod.json"
	expand "version": project.version
}
```
to this:
```groovy
filesMatching("fabric.mod.json") {
	expand "version": project.version
}
```

## Optional: loom 0.8

Strictly speaking it's optional but I do recommend doing this.

*After* getting everything prepared for Gradle 7 and Java 16, change the Loom version at the top to `0.8-SNAPSHOT`.

### Github CI

Since Loom 0.8 only runs on Java 16, you will need to update your CI file to use Java 16. Here, go [copy-paste mine](https://github.com/quat1024/AutoThirdPerson/blob/bb387e048a1463cb0c0f58112a360048ed1dd204/.github/workflows/build.yml).

# part 2: running migrateMappings

See [the Fabric versions page](https://fabricmc.net/versions.html). The provided gradle incantation will remap the sources in `/src/main/java` and put them in `/remappedSrc`. It's not done in-place, but since you *are* using version control (right 👀) it's okay to overwrite your old sources.

You can skip this if your mod is really small; a couple missing mappings here-and-there aren't hard to manually fix. They don't crop up very often.

## Getting acquainted with the new mappings

Late in the 1.17 cycle, Mojang stopped instructing ProGuard to strip unused fields and methods. Many of these are as-of-now unmapped, and Fabric's tooling (controversially?) does not use the official Mojang names.

You are going to see a lot of unmapped `static final int` fields lying around, that's just the way things are right now.

# part 3: starting the engine

Also on [versions.html](https://fabricmc.net/versions.html) is a block you can paste into your `gradle.properties` to check out the latest versions of Minecraft, Yarn mappings, Fabric Loader, and fabric-api. Do that, refresh, maybe run `genSources` as well, and

Oh no

Oh there's a lot of compile errors aren't there

# part 4: The fun part

Here's the part where I dump all the "stuff that I noticed was broken in my mods" on you. This is not an exhaustive list, and only mentions the things that my own mods happen to use.

## Block entities

The constructor that you must call when you extend `BlockEntity` now takes a `BlockPos` and `BlockState`, as well as a `BlockEntityType`. Side-effects of this change:

* `createBlockEntity` in `BlockEntityProvider`, the thing you extend to make your block have a BE, also takes a `BlockPos` and `BlockState` argument instead of a `BlockView` (world) argument.
* If you instantiated your BEs through `BlockEntityType`s, the `instantiate` method on them has changed accordingly.
* `readNbt` no longer takes a `BlockState`, since you already have it from the contructor.

### Goddammit mojang

`BlockEntityType#BlockEntityFactory` is now private for no reason at all, so you can't actually register any block entity types. Find-replace `BlockEntityType.Builder` with `FabricBlockEntityTypeBuilder`.

### `Tickable`

`Tickable` is *completely* gone. (Shock, horror.)

The `BlockEntityProvider` interface now includes a `getTicker` method. Given a world, state, and block-entity type, you may return `null` if you don't tick, or a `(World, BlockPos, BlockState, BlockEntity) -> void` function if you do, and it'll get added to a list of tickers.

Importantly, you may return different tickers depending on the `isClient`-ness of the provided `World`, or even return `null` on one side and a ticker on the other.

Irritatingly, `BlockEntity` is the *last* parameter in the list, so you need to make a static method somewhere.

You'll want a method like this:

```java
@Nullable
public static <A extends BlockEntity, B extends BlockEntity> BlockEntityTicker<B> castTicker(BlockEntityType<B> givenType, BlockEntityType<A> expectedType, BlockEntityTicker<? super A> ticker) {
	//noinspection unchecked
	return expectedType == givenType ? (BlockEntityTicker<B>) ticker : null;
}
```

(`BlockEntityProvider` also has a `getGameEventListener` method, btw, if you want to create something like the skulk sensor.)

## Tags

If you were using `Item#isIn`, it's not public anymore. Use `Tag#contains`.

## Uhh

Probably most relevant to the datagen crew: `ItemPredicate` takes `items` instead of a single `item` now.