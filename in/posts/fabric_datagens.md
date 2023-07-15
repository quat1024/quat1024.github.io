slug=fabric_datagens
title=Fabric 1.16 Datagens
author=quat
description=Quick notes on setting up datagens in a Fabric 1.16 mod
created_date=May 16, 2021
tags=mc-modding,fabric,1.16
draft=true
---
It's really late right now but I want to type these up before I forget.

I've just started using vanilla data generators in my Fabric 1.16 mod [Dazzle 2](https://github.com/quat1024/dazzle-2/). It's not easy to set them up, certainly not as easy as I heard it is in Forge, and you don't have any modloader support. So I'm going to walk through my process.

This was influenced heavily by the [Applied Energistics fabric branch](https://github.com/AppliedEnergistics/Applied-Energistics-2/tree/fabric/master), which does some datagenning. comp500 also helped me a lot and answered some of my questions.

## Gradle

Let's talk about how datagens play into the releasing process, since they muddy it up a bit.

* Right now, you have a `main` source set. This contains all the Java code and all the handwritten assets for your mod, and all of this gets put into your mod's jar.
* You'll want to write a data generator, but there's no point shipping the datagen code with your mod, because it will never get executed and just adds to the filesize.
* Finally, you'll want somewhere for the generated assets to live, preferably away from your handwritten ones.

I solved this problem with three source sets: `main`, `gen`, and `gen_out`.

Let's think about how the source sets interact with each other:

1. `main` has to pull resources from `src/main/resources`, but also from `src/gen_out/resources`
2. Code in `gen` has to be able to reference symbols in the main body of the mod, and also symbols from Minecraft and its dependencies.
3. `gen_out` doesn't have any code.

Here is how I told that to Gradle:

```groovy
sourceSets {
	//Main source code, shipped with the mod
	main {
		resources {
			//this line ships the generated resouces (1)
			srcDirs += "src/gen_out/resources"		
		}
	}
	
	//Source for data generators
	gen {
		//Make sure I can refer to things in the mod and in Minecraft from this source set (2)
		compileClasspath += sourceSets.main.output
		compileClasspath += sourceSets.main.compileClasspath
		runtimeClasspath += sourceSets.main.output
		runtimeClasspath += sourceSets.main.runtimeClasspath
	}
	
	//Source set that holds all the generated data
	gen_out {
		//idk if theres anything to put here (3)
	}
}
```

(There's no `sourceSets` block in the example buildscript, so just add one wherever you like.)

[ Note for the finished article: AE2 only uses two source sets. Mention the difference here ]

I don't fully understand this part, but while we're here, let's also tell Gradle where to pull assets from when releasing the mod, and which to skip (I think?)

```groovy
jar {
	//Mojang datagenerator .cache file
	exclude ".cache"
	
	//ae2 fabric has this little line, i dont know if it's important!
	finalizedBy "remapJar"
	
	from sourceSets.main.output.classesDirs
	from sourceSets.main.output.resourcesDir
}
```

The part I'm not sure on is whether `finalizedBy` is important to ensure the jar gets remapped, and whether the `from` lines are important to ensure datagen code doesn't leak into the built jar. I'll need to do more testing.

Finally, we need a Gradle task to easily run the data generator whenever we like. I used the following... magical incantation, lifted wholesale from ae2-fabric again and I don't really know how it works.

```groovy
task runGenerator(type: net.fabricmc.loom.task.RunClientTask, dependsOn: downloadAssets) {
	classpath = configurations.runtimeClasspath
	classpath sourceSets.main.output
	classpath sourceSets.gen.output
}
```

You can add a `group: "whatever"` between the parenthesis, if you like, to sort the task somewhere else.

(ae2-fabric also set an environment variable in this task (with the line `systemProperty "appeng.generateData", "true"`), and bailed the datagenerator out early if the variable was not set. This does not appear to be necessary for preventing the datagen from running during other tasks.)

Finally, you might want a task similar to this one:

```groovy
task cleanGeneratedResources(type: Delete) {
	delete sourceSets.gen_out.resources.srcDirs
}
```

This task erases the generated resources directory. Of course, be careful with any task that deletes files.

## Code

Create folders `./src/gen` and `./src/gen_out`, and smack the gradle reimport button in IntelliJ. You'll now have three source sets.

In `./src/gen`, place a Fabric mod. Add a `fabric.mod.json` in `./src/gen/resources/fabric.mod.json`, start putting code in `./src/gen/java/your/package/SomeClass.java`, the whole nine yards. ae2-fabric used a mod with a `PreLaunchEntrypoint` instead of a `ModInitializer`, but this did not appear to work for me - I got weird NPEs when loading classes. A normal entrypoint works fine.

This mod will be loaded when you run your `runGenerator` task, but not with regular `runClient`. You might be able to spin up an IntelliJ run configuration from it, but I didn't need to, I just ran my `runGenerator` task.

So, what does structuring a datagen mod look like? I think it's best to explain by example, so here's [AE2's](https://github.com/AppliedEnergistics/Applied-Energistics-2/blob/fabric/master/src/datagen/java/appeng/data/Entrypoint.java) and [mine](https://github.com/quat1024/dazzle-2/tree/shinies/src/gen/java/agency/highlysuspect/dazzle2). Note that AE2 uses MCP names even though it's a fabric mod, they have some magic sauce.

* Locate the base path to dump assets into. This is `src/gen_out/resources`.
	* [ Mention passing this with an argument or environment variable, since it's easier to do from Gradle ]
* Create a `net.minecraft.data.DataGenerator`.
* Into it, `install` things that implement `DataProvider`.
* Call `DataGenerator#run`. This will write all of the files.
* Finally, call `System.exit` so the game doesn't load all the way to the main menu.

Of course, how much you buy into the vanilla datagen ecosystem is up to you.

* You can buy all the way into the `DataGenerator` ecosystem. This gets you timing information and a cache, where assets will not be written to disk if the file hash on-disk is the same.
* You can use the utilities in the `net.minecraft.data` package without a `DataGenerator`, and do the json writing yourself, if you want.
* You can also just roll your own system.

[ Note that your datagen mod should load *after* the main mod, but ahhh fabric doesnt have a way to control load order, entrypoint maybe? ]

## Assets

Now that the scaffolding's out of the way, how do we actually generate assets?

`DataProvider` is an interface for tasks that can be executed by a `DataGenerator`. You'll get a `DataCache` in its `run` method. Using the `DataCache` to write files looks like this:

```java
DataProvider.writeToPath(gson, cache, object, path);
```
where
* `gson` is an instance of `Gson` (create with `new GsonBuilder().disableHtmlEscaping()` and optionally `.setPrettyPrinting()`, then `.create()`, and keep it somewhere accessible),
* `cache` is the provided `DataCache`,
* `object` is some JsonObject,
* and `path` is an NIO `Path` of the filename.
	* Keep the base path handy, call `.resolve` on it to pick the file name.

This serializes the json object with the provided `Gson`, and if its contents differ from the cache, writes it out to disk, making directories if they don't exist. This method `throws IOException`, so it's easiest to call from places that also throw `IOException`, such as `DataProvider#run`.

This is... a bit messy (it's odd that the method to write files is a static method on `DataProvider`, and not on `DataCache` or something), throwing `IOException` is odd when there's no reasonable way to handle it other than aborting, and Mojang breaks this rule themselves (there are lots of calls to this method but other times in Mojang datagens where they just... have the source to this method plonked in somewhere else). Whatever.

### Things to keep in mind

Mojang's stuff is a bit overengineered. Especially when it comes to block and item models: they collect everything into these giant maps, then write the jsons out all at once. The decompiler naming everything generic names like `consumer` and `map1` makes this really hard to untangle. I find it a lot easier to write jsons as-you-go, but a little of the tooling expects `Consumer`s that call into these map adders; using them without kinda feels like using an "out parameter" in C. There's some song and dance.

Also, in Fabric, a *lot* is private. Fabric's tooling doesn't access-widen anything by default. You might be able to experiment with an access-widener, but dev-only AWs sound like a recipe for disaster? Maybe? Typically classes and constructors aren't private (except for the constructors that are), so if you need a utility you can copy-and-paste it out of Mojang's code.

Knock-on effect of "things being too private" is `extend`ing the datagen classes is kinda pointless because you don't have access to any of the members anyways. None of my datagen classes ended up extending anything.

## Blockstates

Blockstate JSONs are easily the most fun application of data gens. Your best friends here are `VariantBlockStateSupplier`, `BlockStateVariant`, and `BlockStateVariantMap`.

`BlockStateVariant` corresponds to each leaf of a blockstate file: `model`, `x`, `y`, `uvlock`, etc.

Create a `VariantBlockStateSupplier` for a particular block, and assign zero or more `BlockStateVariant`s as defaults. If your block has no additional states, you're done and can write the json.

To cover different blockstates, use `BlockStateVariantMap`. Construct it with any blockstate property, then assign `BlockStateVariant`s to each of the values that property can take on using `register`. Finally, assign it to a `VariantBlockStateSupplier.` Notably `VariantMap`s aren't bound to a particular block - you create them for one blockstate *property*, then can apply them as many times as you like to any blocks bearing that property!

You can create a `VariantBlockStateSupplier` for the `facing` property, for example, that doesn't rotate when facing north, rotates 180 degrees when facing south, 90 degrees when facing east, and so on. There are a million examples in the class `net.minecraft.data.client.model.BlockStateModelGenerator`. In fact, that example already exists as `createNorthDefaultHorizontalRotationStates`.

There are also methods for vanilla `mulitpart` models, but I have not examined those yet.

## Recipes

I've always been a big advocate for propertly implementing recipe-unlock advancements, and with recipe generators, there's little excuse not to. Recipe generators generate both at the same time, so you get all the fun of generating recipes through code and recipe advancements fall out practically for free.

`ShapedRecipeJsonFactory` and `ShapelessRecipeJsonFactory` are your friends for most recipes. There are also factories for smelting and a few other types. It doesn't look too hard to write your own (they all simply implement an interface and spit out JSON). Your source for example usages is `net.minecraft.data.server.RecipesProvider`.

While you're here, delete your `data/mymod/advancements/recipes/root.json` and generate it, too:

```java
JsonObject root = Advancement.Task.create().criterion("impossible", new ImpossibleCriterion.Conditions()).toJson();
DataProvider.writeToPath(GSON, cache, root, outPath.resolve("data/mymod/advancements/recipes/root.json"));
```

One gotcha is that building a recipe *crashes* if there is not at least one recipe unlock criterion, so you *must* add an advancement as well. The vast majority of recipe unlock criterion are "player has each item in the recipe", so you'll probably want to write a wrapper method around `recipe.input` that adds both. I'm honestly quite surprised Mojang doesn't have one.

There are also some gotchas when writing out the recipes and advancements:

* These are some of the funny "out parameter" things; cook up a `Consumer<RecipeJsonProvider>` that saves the recipe and advancement JSON, and call `offerTo` on each recipe to send it to that.
* The recipe advancement's parent is always set to `minecraft:recipes/root` and there is no setter. This is not correct for a modded recipe. Before serializing, overwrite the `parent` property on the `JsonObject`.
* The recipe advancement's file-path is taken from the *creative tab ID* of the item in the recipe output. This works great in vanilla, which splits its items up by category, but in a modded context where your creative tab is usually named something like `mymod.group`, this ends up putting your advancement at `data/yourmod/advancements/recipes/mymod.group/whatever.json` which doesn't make sense. I solved this with a simple find-and-replace on the path, `"dazzle.group/"` -> `""`.
* Call `ShapedRecipeJsonFactory#pattern` multiple times, with one line of the recipe pattern per-call.

## Tags

Honestly Mojang's stuff here is an overengineered mess (like most things relating to tags), and there are some private classes involved, so I'm just going to plonk my entire tag-builder wrapper right into this post. Steal it.

```java
public class TagBuilderWrapper<T> {
	public TagBuilderWrapper(Registry<T> registry, Path outRoot, String classifier, Identifier tagId) {
		this.tagBuilder = new Tag.Builder();
		this.reg = registry;
		this.outRoot = outRoot;
		this.classifier = classifier;
		this.tagId = tagId;
	}
	
	//Construct them like this:
	public static TagBuilderWrapper<Block> blocks(Path outRoot, Identifier tagId) {
		return new TagBuilderWrapper<>(Registry.BLOCK, outRoot, "blocks", tagId);
	}
	
	public static TagBuilderWrapper<Item> items(Path outRoot, Identifier tagId) {
		return new TagBuilderWrapper<>(Registry.ITEM, outRoot, "items", tagId);
	}
	
	public final Tag.Builder tagBuilder;
	//Registry for the things in this tag
	public final Registry<T> reg;
	//File output root directory (src/gen_out/resources)
	public final Path outRoot;
	//Folder that tags go into (the "blocks" in "data/mymod/tags/blocks/mytag.json")
	public final String classifier;
	//Name of the tag (the "mymod:mytag" in the above)
	public final Identifier tagId;
	
	//Wrappers around Tag.Builder()
	public TagBuilderWrapper<T> add(T element) {
		this.tagBuilder.add(this.reg.getId(element), "Your Mod");
		return this;
	}
	//Other wrappers omitted for brevity - just mirror Tag.Builder methods
	
	public void save(DataCache cache) throws IOException {
		DataProvider.writeToPath(GSON, cache, tagBuilder.toJson(), getPath());
	}
	
	public Path getPath() {
		return outRoot.resolve("data/" + tagId.getNamespace() + "/tags/" + classifier + "/" + tagId.getPath() + ".json");
	}
}
```

I also have a `BlockAndItemTagBuilderWrapper`, which wraps a `TagBuilderWrapper<Block>` and `TagBuilderWrapper<Item>`, delegating to both, for the extremely common case of having a "blocks" and "items" tag with the same contents only one's a block and one's an item.

(Little edge case that might come up: adding an item multiple times to a tag builder is totally fine, it'll only get written out once.)

## Models

[ Doable, but a bit messy. Item models are somewhat easy? Haven't unwound some of the other cases yet. Private `TextureKey` constructor is annoying but easily reflected. Gotcha: `Model`s define what textures they're going to use and not the other way around, so you can't add `TextureKey`s onto whatever you want and expect them to appear in the gneerated model JSON. ]

## Block Loot Tables

A popular use of data generators because like 99% of blocks simply drop themselves.

Here, have this snippet:

```java
private LootTable drops(ItemConvertible item) {
	return LootTable.builder().pool(
		LootPool.builder().rolls(ConstantLootTableRange.create(1))
			.with(ItemEntry.builder(item))
			.conditionally(SurvivesExplosionLootCondition.builder()))
		.type(LootContextTypes.BLOCK)
		.build();
}
```

Call that with whatever item you want. Then call `LootManager.toJson` on the resulting loot table. You'll get this (possibly very familiar-looking) JSON snippet:

```json
{
	"type": "minecraft:block",
	"pools": [
		{
			"rolls": 1,
			"entries": [
				{
					"type": "minecraft:item",
					"name": "mymod:my_item"
				}
			],
			"conditions": [
				{
					"condition": "minecraft:survives_explosion"
				}
			]
		}
	]
}
```

## Language Entries

[ possible to generate these, but merging them into en_us.json requires some work or manual copy-pasting ]

[ is it possible to use a Gradle task to merge the language entries? right now d2 reaches over into the main source set and merges them in itself, which is a bit hacky ]