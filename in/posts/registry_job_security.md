slug=registry_job_security
title=Registry deep dive
author=quat
description=Ok how does the registry system work *actually* in 1.20.1
created_date=Nov 30, 2023
tags=minecraft,mc-modding
---

Another notes page!

# ResourceLocation

namespace, a string
value, a string

These are "block ids", you're familiar with em

# Registry<T>

A bidirectional mapping from ResourceLocation to T.

## DefaultedRegistry (subinterface)

When you call `.get()` on a ResourceLocation that isn't registered in the registry, you get the "default" object (think "pig spawners", "missing blocks being replaced with air")

## WritableRegistry (subinterface)

Exposes a `.register` method.

Actually, all of the registries implement `WritableRegistry`. Not exposing the WritableRegistry interface is just a "casting away const" thing.

## MappedRegistry

idk????

## listing

- DefaultedMappedRegistry
- DefaultedRegistry
- MappedRegistry
- NamespacedDefaultedWrapper (forge)
- NamespacedWrapper (forge)
- WritableRegistry

# BuiltInRegistries

First, BuiltInRegistries is populated.

1. In all initialization paths (client, server, datagen), Bootstrap.bootStrap() is called very early.
2. Bootstrap classloads BuiltInRegistries (by referencing BuiltInRegistries.REGISTRY).
3. BuiltInRegistries contains lots of fields, each defining a registry type. As the fields of the class are loaded, one by one:
  * Each registry is added to BuiltInRegistries.REGISTRY.
  * A BuiltInRegistries.RegistryBootstrap function is added to BuiltInRegistries.LOADERS.
  * Each registry is initially empty.
4. Bootstrap continues to call some miscellaneous functions, eventually calling BuiltInRegistries.bootStrap().
5. This calls BuiltInRegistries.createContents(), which calls every LOADERS function in turn.
  * These functions perform the initial population of the registry. Sometimes this is done explicitly, using methods like `PoiTypes::bootstrap`. Other times this is done via classloading, and simply `return Blocks.AIR` triggers a classload of `Blocks` which populates the registry.
  * The return value of this function is *not* actually the default value of this registry. The game just checks if it's null and pops an error if it is.
6. Next, .freeze() is called on the root registry & all registries inside it.
  * Sets a "frozen" boolean. If set, writing to the registry will crash.
  * some Holder bullshit happens, i think this is for checking that all constructed things were actually registered, and there aren't any dangling Block instances that aren't in the block registry?
7. Next, .validate() is called, which just checks that no registries are empty & defaulted registries actually have a default item.

### zomg when is forge??

Forge later unfreezes the registries, fires registry events, then freezes them again

## RegistryAccess

A view into a collection of registries.

The operations are:

* `registry` / `registryOrThrow`, which obtains a registry given a `ResourceKey`
* `registries`, which returns all registries the access knows about
* `lookup`, which does... whatever the fuck (tags? feature flags? holders?)
  * Probably useful if u know how tf to engage with the holder system

## registry layers

Registry layers solve two problems:

* Before you can load the tree features, you need to load the biomes they're placed in; before you can load the biomes, you need to load the blocks they're composed of.
* This stuff might change from server to server. When the server reloads resourcepacks, or when the client connects to a different server, you need some way to blow away all the server-specific registry entries while keeping the built-in ones.
  * (Not all the features of this system are used currently. The server doesn't reload most of its layers.)

Enter `LayeredRegistryAccess`. This is a `Map<RegistryLayer, RegistryAccess>` in disguise.

On the server, the `LayeredRegistryAccess` is kept in `MinecraftServer.registries()`, and on the client, `ClientPacketListener.registryAccess`. (There's a third one in `PlayerList` but it's just another reference to the one from `MinecraftServer`.)

On the server, there are four registry layers - `STATIC`, `WORLDGEN`, `DIMENSIONS`, and `RELOADABLE`. (Notice how things like configured features are placed in dimensions, dimensions consist of biomes and other worldgen stuff, and all that is built of built-in registry items - you can see how they form a hierarchy, where each layer builds on things registered in the previous layer.) On the client there are just two - `STATIC` and `REMOTE`.

The `STATIC` layer (on both sides) is composed of a `RegistryAccess` that exposes `BuiltInRegistries`. True to name, the contents of the `STATIC` layer can be accessed from anywhere. Deeper layers cannot be, because they require access to more state - you can't know the "list of configured features" in a context with no minecraft server to query datapacks from.

As far as I can tell, each layer consists of a *nonoverlapping* set of registries, i.e. every registry in the game belongs to, at most, one layer; you can't combine statically-registered blocks with dynamically-registered blocks. This is checked.

The operations on `LayeredRegistryAccess` are:

* `getLayer`, which returns a view into only the things registered in a specific layer
* `compositeAccess`, which returns a view into all registries
* `getAccessForLoading`, which returns a view into all registries at or below a specific layer
* `replaceFrom`, which is a bit multipurpose
  * called with one argument (a layer type), it "chops" the LayeredRegistryAccess *below* that layer, i.e. it removes that registry layer and all above it
	* called with two arguments (a layer type & a replacement registry access), it removes that registry layer (and all above it), then replaces the layer with a new one

On the client, the `REMOTE` layer is populated in `ClientboundPacketListener.handleLogin` only. Registries in the REMOTE layer:

* biome
* chat type
* trim pattern
* trim material
* dimension type
* damage type

The contents of these registries are synced from server to client in the initial login packet. The client does not know about many registries that aren't pertinent to it (like the configured feature registry).

On the server, the `WORLDGEN`, `DIMENSIONS`, and `RELOADABLE` layers are all populated in `WorldLoader.load`. The `RELOADABLE` layer is also reloaded in `MinecraftServer.reloadResources`, of course.

Registries in the `WORLDGEN` layer on the server:

* dimension type
* biome
* chat type (yes, even though it's not worldgen)
* configured carver
* configured feature :bangbang:
* placed feature
* structure
* structure set
* processor list
* template pool
* noise settings
* noise
* density function
* world preset
* flat level generator preset
* trim pattern
* trim material
* damage type
* multi noise biome source parameter list

Registries in the `DIMENSIONS` layer on the server... just this one:

* level stem

Registries in the `RELOADABLE` layer on the server:

* Nothing?
* You'd expect recipes, advancements, functions, &c to be in here, but they don't interact with the registry system. Recipe *types* do, but they're in STATIC.