slug=we_out_here_reloadin
title=Overview of Resource Reloading in 1.14.4/Fabric
author=quat
description=On the new resource reloading system introduced in 1.14.
created_date=Jan 19, 2020
tags=mc-modding,fabric,1.14
---
This article was formerly published on my Github account [here](https://gist.github.com/quat1024/2645637708b9577a57671df0eab953e2/), although I never finished it. I've reprinted it on my new website as it originally appeared.

<hr class="think"/>

### TL;DR

If you want to load some resources or data in Fabric 1.14 or 1.15, do this:

```java
ResourceManagerHelper.get(ResourceType.ASSETS).registerReloadListener(new SimpleResourceReloadListener<MyResource>() {
  @Override
  public Identifier getFabricId() {
    return new Identifier("some_identifier", "that_describes_this_task");
  }
  
  @Override
  public CompletableFuture<MyResource> load(ResourceManager manager, Profiler profiler, Executor executor) {
    return CompletableFuture.supplyAsync(() -> {
      //Do loading tasks (read files, grab things from the ResourceManager, etc)
      //You're off-thread in this method, so don't touch the game.
      MyResource res = loadMyResource(manager);
      return res;
    }, executor);
  }
  
  @Override
  public CompletableFuture<Void> apply(MyResource res, ResourceManager manager, Profiler profiler, Executor executor) {
    return CompletableFuture.runAsync(() -> {
      //Your loaded resource gets threaded into   ^^^ the first argument of this method.
      //Apply the loaded data to the game somehow (dump caches and refill them, set variables, etc)
      applyMyResourceToTheGame(res);
    }, executor);
  }
});
```

If you just want to listen to the resource reloading process and do something when it's done (postprocess a resource, print a message, whatnot), but you don't need to load anything new in-game, instead do this:

```java
ResourceManagerHelper.get(ResourceType.ASSETS).registerReloadListener(new SimpleSynchronousResourceReloadListener() {
  @Override
  public Identifier getFabricId() {
    return new Identifier("some_identifier", "that_describes_this_task");
  }
  
  @Override
  public void apply(ResourceManager res) {
    //Do what you need to do
  }
});
```

Some code examples:

* Satin, using an async reloader: [registering](https://github.com/Ladysnake/Satin/blob/2f5cf9d9865aff4c8b9b6aae400d9765cb7ee8d4/src/main/java/ladysnake/satin/Satin.java#L34), [using](https://github.com/Ladysnake/Satin/blob/2f5cf9d9865aff4c8b9b6aae400d9765cb7ee8d4/src/main/java/ladysnake/satin/impl/ReloadableShaderEffectManager.java)
* Exotic Matter, using a synchronous reloader: [registering](https://github.com/grondag/exotic-matter-2/blob/c0099eb456121ed405fab3cd704b8cba8e4c1634/src/main/java/grondag/xm/XmClient.java#L46), [using](https://github.com/grondag/exotic-matter-2/blob/c0099eb456121ed405fab3cd704b8cba8e4c1634/src/main/java/grondag/xm/paint/XmPaintRegistryImpl.java)
* Blue Light Special, using an async reloader: [registering](https://github.com/kvverti/blue-light-special/blob/1f522285ef7e489ff96511a6069db0c12f4ca658/src/main/java/io/github/kvverti/bluelightspecial/BlueLightSpecialClient.java#L23), [using](https://github.com/kvverti/blue-light-special/blob/1f522285ef7e489ff96511a6069db0c12f4ca658/src/main/java/io/github/kvverti/bluelightspecial/client/resource/CagedLanternColorSupplier.java)

What???
=======

Mojang did a number to the resource reloading system in 1.14. It's a lot more complicated and if you aren't familiar with asynchronous programming/`CompletableFuture`s like I am, it's very hard to use.

* The same machinery is used on the client to reload resource packs and on the server to reload data packs, since they are basically the same thing as far as the system is concerned.
* It's also used during the game startup process, all the way down to the initial loading splash screen and the resource-reload progress screen being literally the exact same screen.
* It's now multithreaded! There's a number of different resource *types* in Minecraft (client: fonts, textures, sounds, colormaps, ..., server: functions, tags, recipes, ...) and they all get loaded at the same time.

N.B. Throughout this article, "resource" will be used to interchangably refer to resource packs and data packs, since the resource reloader doesn't care.

Also, I won't be going into too much detail on the `ResourceManager` itself. It's the "overridey filesystem" that lets you just ask "gimme `/textures/minecraft/entity/pig.png`" without having to worry about which resource pack in the cascade that image is going to come from.

Why???
======

* Why *not* multithread it? Honestly it's really a lot faster.
* Some resources take a long time to cook even after they're prepared: texture stitching, fonts, and so on. This has to get done eventually, but there's no need for them to block like, file I/O in the meantime.

How
===

I'm going to start from the bottom (how Mojang implements resource reloading in Minecraft), show why it's a pain to implement them the way Mojang does, and work up to how Fabric helps you implement resource reloaders in your mod.

## `ResourceReloader`

This is the management class for all resource reloading and where "the magic happens". Unfortunately the code is a *complete* mess to read and understand... there is a lot going on, and this is kinda the intersection of a bunch of different tasks the resource reloading system wants to be able to do (reloading in the client and server environments, debuggable/profilable reloading, etc) so there are a lot of loose variables.

Here's the important takeaways:

* The two `Executors` correspond to the two stages of resource reloading. The first `Executor` is for *loading* tasks and the second is for *application* tasks.
* The loading executor is typically used for things like reading a texture or resource from disk.
* The application executor is typically used for processing and finalizing the data (setting the variables to the new data, dumping old caches)
* For example, on the client: 
  * The loading executor is the *server worker thread pool*, which you may recognize from its job of managing async tasks like chunkloading and generating the datafixer.
  * This is a pool consisting of multiple threads; this is where the concurrency happens
  * The application executor is `MinecraftClient`.
  * If you've ever processed a server-to-client packet, using it as an `Executor` is familiar to you; this is exactly the same object you get when you call `packetContext.getTaskQueue().execute(something)`. It's for the same reason: you were off-thread, but now you want to touch the game, so you need to get on-thread.

## `ResourceReloadListener`

This is a functional interface from Minecraft representing some type of reloading task.

The Yarn name `reload` is a bit misleading - it should probably be something like `createReloadTasks` - because no "action" happens in this method. It merely creates and returns a `CompletableFuture`, and it's the *`Future`'s job* to submit loading and application tasks to the appropriate executors. When those tasks get executed *that's* when the "reloading" arguably occurs.

You'll also notice an inner interface here, `Synchronizer`. An instance of this interface is passed into `reload`, and its `whenPrepared` method is how you tell Minecraft "ok, I am done preparing my asset, it's now time to move into the application stage and apply them to the running game". You can supply any object you want (presumably, the result of loading the resources from disk) in your `CompletableFuture`; the `Synchronizer` simply passes it down unmodified so you can use it in your application task.

So much talk, so little code. Here's the general skeleton for implementing your own resource reload listeners from scratch:

```java
public CompletableFuture<Void> reload(Synchronizer helper, ResourceManager resourceManager, Profiler loadProfiler, Profiler applyProfiler, Executor loadExecutor, Executor applyExecutor) {
  return CompletableFuture
    .supplyAsync(() -> {
      MyResource res = doSomeLoading(loadProfiler);
      return res;
    }, loadExecutor)
    .thenCompose(helper::whenPrepared)
    .thenAcceptAsync((res) -> {
      doSomeApplication(res, applyProfiler);
    }, applyExecutor);
}
```

This is where it might get a bit funny looking if you're not familiar with asynchronous programming. Note that the body of `reload` doesn't do anything except return a really big CompletableFuture. *Nothing has been executed yet*.

Note the pattern: `supplyAsync` takes a function which supplies an asset (and it happens on the `loadeExecutor`), `thenCompose` takes `helper::whenPrepared` which tells MC you're done with this stage, and finally `thenAcceptAsync` takes a function which accepts the supplied asset (this time on the `applyExecutor`).

Again, this is just a pile of three functions; these get scheduled to the appropriate thread pools and later executed whenever an asset reload happens (F3+T client, `/reload` server), but nothing has happened immediately after calling `reload`. It's a common and understandable learner's mistake to try and do something in `reload` - nope, it's too early.

In fact, Mojang uses this pattern so much they have a helper class for it. It's been named `SinglePreparationResourceReloadListener`. Oh, and of course, actually making *use* of the profilers is optional, but Mojang does, and you should too.

So, now you know the inner guts. Spoiler though, you probably won't be implementing this class yourself, since Fabric provides some machinery to make implementing this class much, much easier.

# Fabric's machinery

The `fabric-resource-loader` module of Fabric API, among other things, makes it easier to create new `ReloadListener` tasks for whatever you want to reload. Here is a list of your new favorite classes (all in `net.fabricmc.fabric.api.resource`):

## `ResourceManagerHelper`

Your entrypoint into the hell world. Call `ResourceManagerHelper.get(ResourceType.ASSETS)` for the clientside resource reload listener, and `ResourceType.DATA` for the serverside one. Register reload listeners to the returned object with, well, `registerReloadListener`

Any listeners registered to this happen *after* vanilla loading processes, which is usually what you want anyways - if you want to *change* vanilla loading processes instead, lean on Mixin.

The whole `Helper` wrapper (instead of just adding them to MC's resource reload manager directly) helps preserve the invariant that custom ones always happen after vanilla ones and vanilla ones always happen in the same order as they do in vanilla.

## `IdentifiableResourceReloadListener`

You probably won't end up implementing this yourself either. This interface extends vanilla `ResourceReloadListener` with two additional methods: one (`getFabricId`) returns an `Identifier` uniquely identifying this listener (so like, `mymod:fancy_particle_loader` or something).

The other method (`getFabricDependencies`) is optional, and pertains to a small Fabric extension to the reload listener system - it returns a collection of `Identifiers` of listeners that *must* have their application stage happen *before* this one. Useful if you need that sort of thing.

(It's not possible to order the preparation stages because it's multithreaded; their order is at the whimsy of the thread pool running them.)

Note that vanilla reload listeners have this interface mixed on (check `MixinKeyedResourceReloadListener`), so vanilla resource reload listeners also have a `FabricId`. Check `ResourceReloadListenerKeys` for a list. (You can use these vanilla IDs in `getFabricDependencies`, but modded ones all happen after vanilla ones anyways, so who cares.)

## `SimpleResourceReloadListener`

This is the money shot.

This interface implements `IdentifiableResourceReloadListener` with the pattern in the far-above code sample, breaking out `load` and `apply` into convenient, separated methods and hiding most of the dirty `CompletableFuture` plumbing, and **is the interface you probably want to implement if you are loading assets from a resource or data pack.**

This is the interface illustrated in the code sample all the way at the top of this article.

Submit these to the resource reload system by calling `ResourceManagerHelper.get(...).registerReloadListener`.

## `SimpleSynchronousResourceReloadListener`

This interface has no methods of its own, but is a union of `IdentifiableResourceReloadListener` and vanilla Minecraft's `SynchronousResourceReloadListener` (a simplified interface with an empty `load` stage).

If you simply want to hook the Minecraft resource reloading process and do something after it happens, but you don't need to load anything new from disk (say, you're dumping a cache, printing a message, or doing some post-processing on a resource), then **this is the interface you probably want to implement**.

Submit these to the resource reload system the same way as a more complex one: `ResourceManagerHelper.get(...).registerReloadListener`.

Common problems
===============

### I rolled my own resource reloader but the game never seems to finish reloading, the progress bar just gets stuck at 95%. What's going on?

When implementing `reload`, it's tempting to try and blow off the complexity of Minecraft, do all the work in the main body of `reload`, and return some dummy `CompletableFuture` just to satisfy the method contract. Don't: it's wrong, it's probably not thread-safe, and since `whenPrepared` is never called Minecraft just waits forever for your reload listener to finish the loading stage.

If you just want a simple "hey, I'm reloading" hook, use `SimpleSynchronousResourceReloadListener`; if you want to load some data, use `SimpleResourceReloadListener`.

Thanks
======

Thanks to williewillus for pointing some stuff out about resource reload listeners in Forge on Vazkii's Discord.