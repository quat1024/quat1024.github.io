slug=one_point_eightteen_notes
title=Updating to Fabric 1.18 notes
author=quat
description=Aggregated notes on updating mods to Fabric 1.18
created_date=Nov 30, 2021
updated_date=Dec 03, 2021
tags=mc-modding,fabric,1.18
---
I want to get off Mx. Mojang's Wild Ride

# Java 17

Unlike the big Java 8 to 16 jump we did last time, there are fewer weird tooling troubles with Java 17.

I don't know why the process of "getting the most recent version of OpenJDK" seems to change every 15 minutes, but these days, go to [Eclipse Adoptium](https://adoptium.net/) and get Temurin 17, which is relabeled OpenJDK, which is relabeled Hotspot. Why. I'm sure come the next Minecraft java version bump the process will be different again.

If you're on Windows and use Scoop, `scoop install temurin17-jdk`. If you're on Linux, I (for once) get to make fun of your package manager because it's probably still stuck on 11. Don't bother with Oracle's site.

Couple things to check:

* make sure your `JAVA_HOME` is pointing at the new Java installation
* make sure to update `sourceCompatibility`/`targetCompatiblity` in build.gradle to 17
* make sure to update `compatibilityLevel` in your `mixin.json`
* Don't forget to change the Java version in your continuous integration pipelines too, if you use that!

# Gradle

Update Gradle to 7.3. It has better support for Java 17. It sometimes works without updating the wrapper, but Github Actions in particular is *super* picky.

```console
./gradlew wrapper --gradle-version 7.3

# check
./gradlew --version
```

## Troubleshooting

If you're getting crap like `major version 61 is newer than 60, the highest major version supported by this compiler. It is recommended that the compiler be upgraded.` or `invalid source release: 17`, here are some magical incantations to try:

* Project structure -> get everything on to Java 17
* In IntelliJ, settings -> build, execution, deployment -> build tools -> gradle, make *Triple Sure* that the Gradle JVM is set to `Project SDK`, or is otherwise on Java 17. This is like 90% of the issues.

If that didn't work:
* Make sure everyone's actually on Java 17: restart Intellij, run `./gradlew --stop` to kill the gradle daemon, etc. Double check your `JAVA_HOME`
* Delete `.gradle/caches/fabric-loom/1.18` then run any gradle task (`clean` will do) to dump any .jar files that might have been put together with an old compiler
* If all of that doesnt work uhh idk., try lighting your computer on fire

### Native libraries problem?

I had some weird issue about LWJGL not being able to find native libraries, which caused the game to crash with a `NoClassDefFound` on `blaze3d.RenderSystem`. I don't know if the following actually fixed it, but I did this and then it worked: delete the "Minecraft Client" and "Minecraft Server" run configurations, then run `clean` to have Loom re-create them.

# Loom

[Fabricmc versions](https://fabricmc.net/versions.html) says at the bottom in bold letters, *The recommended loom version is 0.10-SNAPSHOT*, so, do that. It's at the top of your build.gradle. It also works ok on Minecraft 1.17 so why not.

# Remapping

If you haven't started using official Mojang names, now is a good time to start. Yarn is atrophying a bit in the presence of Mojang's names, since the project isn't as needed anymore.

I recommend remapping to official names first, and then updating to 1.18 next. Just so you have fewer changes and less to worry about at each step.

To run the auto-remapper, before changing anything relating to mappings in the buildscript (so loom can figure out what mappings you're *currently* on), run `gradlew migrateMappings --mappings "net.minecraft:mappings:1.17.1"`, or maybe ending in only `1.17` if your mod was written against 1.17.0. Finish up by copying `remappedSrc` over `src/main`.

Then, adjust your buildscript as follows. If you don't mind not having parameter names in `genSources`, replace this:

```groovy
mappings "net.fabricmc:yarn:${project.yarn_mappings}:v2"
```

with this:
```groovy
mappings loom.officialMojangMappings() //notice the "loom"
```

And if you want some parameter names, the ParchmentMC project provides some. Add them to your repositories block:
```groovy
repositories {
	maven {
		name = "ParchmentMC"
		url = "https://maven.parchmentmc.net/"
	}
}
```

and use this for your `mappings` instead:
```groovy
mappings loom.layered() {
	officialMojangMappings() //notice no "loom"
	parchment("org.parchmentmc.data:parchment-1.17.1:2021.10.31@zip")
}
```

I don't think there is a Parchment release for 1.18 yet. Parchment releases for the wrong version actually still work, though (more or less).

Some sharp edges with the auto remapper:

* If you played with Java 16 Records in your 1.17 mod, Mercury currently blows up on them. Use the intellij intention to convert them to normal classes, remap, then convert back.
* `@Inject` targets and some other Mixin string-things don't get remapped.

# Fabric API

## Tool Tags

`fabric-tool-tags` has been deprecated. It still works, for now, but is marked `Deprecated(forRemoval = true)`. I encourage you to migrate to the vanilla `mineable/blah` block tags now, before you *have* to do it. Throw em in your datagen if you want. (fabric-api JUST landed some datagen tools, btw)

`fabric-mining-level-api` adds additional `fabric:mineable/sword` and `fabric:mineable/shears` block tags.

## Block Entity Syncing

`BlockEntityClientSerializable` is gone 🦀

The reason it existed in the first place was that `BlockEntity#getUpdatePacket` was not pluggable by mods, and it was hard to convince the game to actually sync your block entity data with the client. 1.18 changed `getUpdatePacket` so mods can use it, meaning a workaround is no longer needed.

There is a general-purpose block entity syncing vanilla packet, mojang name `ClientboundBlockEntityDataPacket`. It calls `BlockEntity#getUpdateTag` on the server and sends the resulting compound tag to the client, which proceeds to call the normal `BlockEntity#load` method on the client world with it.

Many vanilla `BlockEntity`s have this boilerplate:

```java
@Override
public Packet<ClientGamePacketListener> getUpdatePacket() {
	return ClientboundBlockEntityDataPacket.create(this);
}

@Override
public CompoundTag getUpdateTag() {
	//calls into "saveAdditional", which is the mojang name for
	//the general-purpose "write my data to NBT" method on BlockEntities
	//that you are familiar with
	return saveWithoutMetadata();
}
```

This setup will sync the entirety of the server's NBT tag (save the redundant `id` and `x`/`y`/`z` fields, which aren't written when using `saveWithoutMetadata`) to the client. If you don't want to send the *entire* tag, return something different in `getUpdateTag` (see: the campfire).

Calling `level.sendBlockUpdated(getBlockPos(), getBlockState(), getBlockState(), 3);` will fire the server-to-client sync packet, just like what `BlockEntityClientSerializable#sync` did. That's kind of a mouthful of a method name, and you typically want to call it in the same contexts you'd mark the chunk dirty in, so many vanilla `BlockEntity`s have this helper method defined as well:

```java
//(not an @Override!)
private void markUpdated() {
	//you may know this one as "markDirty":
	setChanged();
	//causes the update packet to be sent:
	level.sendBlockUpdated(getBlockPos(), getBlockState(), getBlockState(), 3);
}
```

Know that the vanilla `ClientboundBlockEntityDataPacket` calls the same `load` method that loading a `BlockEntity` on the server calls. (You are free to make your own `Packet<?>` and return it in `getUpdatePacket`, although it's a bit awkward because I don't know if you can use the fabric-api convention of custom payload packets here.)

# Of interest to codecbrained dorks:

`Registry<T>` no longer directly implements `Codec<T>`, but it does offer a `byNameCodec()` method. The returned codec works the same as it used to; i.e. it saves and loads the registry entry to its `ResourceLocation`.