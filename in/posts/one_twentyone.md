slug=one_point_twentyone_compiling
title=How to at least *start* updating your mod to 1.21
author=quat
description=Always on a plane, always something new
created_date=Sep 21, 2024
subject=minecraft
---
what's 9 + 10

## Getting the damn thing to compile again

You know how it is with Minecraft projects, if you sneeze the toolchain breaks, so here's a way to at least get the project into a known-working state.

* Rename `build.gradle` (and `settings.gradle` if it exists) to something else, lest you get stuck in a timeloop where the Minecraft plugins crash because Gradle is too old and `./gradlew wrapper` doesn't work because the Minecraft plugins crash.
* Create a dummy `build.gradle` just so Gradle still thinks this is a project. (`touch` is enough.)
* If you're using Gradle 7 (or earlier), run `./gradlew wrapper --gradle-version 7.6.4`. This is the latest version of Gradle 7.
* Move `build.gradle` and `settings.gradle` back.

In my shell I set up `JDK8`, `JDK17`, and `JDK21` aliases pointing to the respective installation's `JAVA_HOME`. When something stupid happens, `JAVA_HOME=$JDK17 ./gradlew ...` is a good first fix.

If it's a project I *really* havent touched in a while, I like to do all this in the terminal before opening the IDE. IntelliJ users should remember to set the project JDK to something reasonable in the "Project Structure" dialog, remember to double-check that `Settings -> "Build, Execution, Deployment" -> Build Tools -> Gradle` has the JDK set to "project JDK", and remember that their terminal might have a different `JAVA_HOME` than their IDE.

After this you should be able to at least look around, `./gradlew clean`, compile the project, etc.

## Getting on Gradle 8

If you use subprojects for Fabric and Forge in the same tree, now's a good time to comment them out of your `build.gradle`. The newest versions of Minecraft ecosystem plugins require Gradle 8 and there's no combination of versions where `./gradlew version` works *and* the Minecraft plugins work. If you don't use subprojects, rename `build.gradle` again.

After that, run `./gradlew wrapper --gradle-version 8.10.1`, which is the current latest version of Gradle 8.

The standard Gradle 8 growing pain: if you used the gradle `toolchain`s feature at all, don't forget to paste

```groovy
plugins {
	id "org.gradle.toolchains.foojay-resolver-convention" version "0.8.0"
}
```
into your `settings.gradle`.

### Updating Fabric Loom projects

The [latest stable version of Fabric Loom, at the time of writing](https://maven.fabricmc.net/fabric-loom/fabric-loom.gradle.plugin/), is `1.7.4`. Might soon be 1.8. Don't use a `-SNAPSHOT` and don't use a `1.7.+` version bound, it's not worth it.

I changed the Loom version, uncommented it from `settings.gradle`, and refreshed Gradle. This took a few minutes since Loom decided to redownload everything but the process was otherwise uneventful.

### Updating `minivan` projects

(Tooting my own horn here: if you're one of the three people who use [minivan](https://github.com/CrackedPolishedBlackstoneBricksMC/minivan) to manage a loader-independent subproject, the latest version is `0.5`. And it supports access transformers!)

### Updating ForgeGradle projects

First update ForgeGradle to version `6.0.29`, a version that supports Gradle 8. Again, don't use a `-SNAPSHOT` and don't use a `6.0.+` version bound.

If your project did not already use official mappings (unlikely if you're doing multiloader stuff), get on them now. NeoForge has basically removed mappings.

#### To NeoForge

[Get on NeoGradle](https://docs.neoforged.net/neogradle/docs/). Their Maven is a bit of a maze (NeoGradle was renamed several times); the correct group is `net.neoforged.gradle` and artifact is `userdev`.

First, change the plugin. Remove MixinGradle if you used it; it's not compatible with NeoForge and is not needed.

```groovy
buildscript {
	repositories {
		mavenCentral()
		maven { url = "https://maven.neoforged.net/releases" } //change
    
    //this maven is still needed for "gradle.plugin.org.jetbrains.gradle.plugin.idea-ext:gradle-idea-ext:1.1.6"?
    //what da hell
		maven { url = "https://repo.spongepowered.org/repository/maven-public/" }
	}
	dependencies {
		classpath "net.neoforged.gradle:userdev:7.0.163" //change
	}
}
apply plugin: "java"
apply plugin: "net.neoforged.gradle.userdev" //change
```

Under NeoGradle, Minecraft lives in the `implementation` source set, no custom `minecraft` set needed:

```groovy
//old
minecraft "net.minecraftforge:forge:${forge_version}"

//new
implementation "net.neoforged:forge:${neoforge_version}"
```

(Since this is till a 1.20.1 mod, we're in the NeoForge compatibility period. They [shipped under the `net.neoforged:forge` group/artifact](https://maven.neoforged.net/#/releases/net/neoforged/forge) during this period. Versions range from `1.20.1-47.1.5` to `1.20.1-47.1.106`.)

Remove the `minecraft { }` block entirely, including the `mappings channel:` line, since NeoForge removed mappings.

Hoist `runs` to the top level. Run configs are very different:

* It's now a gradle `NamedDomainObjectController`, which is Gradlespeak for "something you can `configureEach`.
* The oddball `mods { }` block has been supplanted by `modSource` / `modSources`.
* `ideaModule` has been axed.
* Change `property` calls (to set the log level, etc) into `systemProperty` calls. [Documentation](https://docs.neoforged.net/neogradle/docs/configuration/runs) says `props` exists. It doesn't.

I removed my entire `runs` block and replaced it with this:

```groovy
runs.configureEach {
	workingDirectory file("./run")
	modSource project.sourceSets.main
}
```

*Don't* add your `:xplat` project to `modSource`. NeoForge will try to load the build directory of your xplat project *as a mod* and will fail spectacularly.

#### Mixins

MixinGradle is not needed and is not supported. You can remove it.

During the 1.20.1 transitional period, the `[[mixins]]` block in `mods.toml` is not yet supported by NeoForge. This is fine since we're just using 1.20 NeoForge as a stepping stone, but if you really want to work with Mixin on Neoforge 1.20.1, you'd have to mention your mixin config file in `MANIFEST.MF` the way MixinGradle did:

```
MixinConfigs: mymod.mixins.json
```

and probably do something about refmaps.

During 1.21, rename `mods.toml` to `neoforge.mods.toml`, and add this to the bottom:

```toml
[[mixins]]
config = "my_mod.mixins.json"
```

Another knock-on effect of NeoForge standardizing mappings: they've removed the need for refmaps. If you build your mod and don't find a refmap in the jar, that's normal and it will work in production.

#### Multiloader shit

[NeoGradle is pissy about the multiloader-template style fatjars](https://github.com/neoforged/NeoGradle/blob/NG_7.0/README.md#handling-of-none-neogradle-sibling-projects).

Too fucking bad! I'm doing it anyway.

## Breather

What has been accomplished so far:

* Getting Gradle to the latest version.
* Getting Loom to the latest version.
* Getting the mod onto the latest version of NeoGradle.

All of this stuff is 1.21 ready and Java 21 ready. It's time.

## Java 21

Record patterns/pattern-matching-for-switch, those funny sequenced collections interfaces, green threads (which are not too relevant in a game context), and Generational ZGC (proving that Minecraft truly is for Gen Z).

In IntelliJ, set the project JDK to 21, and since you *did* remember to set `Settings -> "Build, Execution, Deployment" -> Build Tools -> Gradle` (right), this will cause Gradle to be invoked with Java 21.

## Fabric

Head to [fabricmc.net/develop](https://fabricmc.net/develop/) to check the latest fabric-loader and fabric-api versions, as usual.

For *Rebind Narrator* everything worked fine on 1.21 out of the box, although it does only use two fabric-api modules.

## NeoForge

Head to [the NeoForged homepage](https://neoforged.net/) to check the latest version of NeoForge. Currently the *latest* version is broken on NeoGradle but `21.1.47` seems to work.

This is past the compatibility period, so you'll have to do porting work. This means changing the package of all forge classes, taking the `IEventBus` through your mod's constructor rather than <code style="overflow-wrap:anywhere">new IFMLJavaModLoadingEventBusGetterFactory().createFMLJavaModLoadingEventBusGetter().get().getEventBus().getBus().pleaseGiveMeTheBus()</code> or whatever it was, etc etc.

Non-satisfying ending to this post. I was planning on writing a small "things I noticed when porting to 1.21" guide, but *getting* to this point has already taken several more hours than I thought it would, so I only had time to port an extremely small mod.