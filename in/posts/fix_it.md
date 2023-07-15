slug=intellij_fix_it
title=Fix stuff being broke in IntelliJ
author=quat
description=On fixing old ForgeGradles with new IntelliJs.
created_date=Jan 19, 2020
tags=mc-modding,forge,1.12
---
This article was formerly published on my Github account [here](https://gist.github.com/quat1024/8bf436c85e5c140d27d49a7dc6c09982/). It was during a time when ForgeGradle didn't work well with 1.12 mods. Since most users don't mod 1.12 anymore, it's mostly historical information, but I'll leave it up in case someone finds a use for it.

<hr/>

# What

When compiling mods in recent versions of IntelliJ, weird things start happening:

* With ForgeGradle 2 (1.12-), none of the assets show up in-game (language keys, models, textures etc)
* Broken hotswapping.
* Potentially other Bad, Terrible Things that are yet to be discovered.

# How

## Hotswapping is broken / Resources are broken

1. Open Settings (head to File -> Settings).
2. Expand "Build, Execution, Deployment".
3. Expand "Build Tools".
4. Expand "Gradle".
5. Under the right pane, under "Build and Run", change both from "Gradle" to "IntelliJ Idea".
6. Apply.
7. Restart IntelliJ (quick way: is File -> Invalidate Caches / Restart -> Just Restart)

You will need to change this once for every project.

You also may have to set the project build directory after configuring this, since IntelliJ forgot; just use the `build/` directory (in the root of your project, adjacent to `src/`, probably already exists if you compiled it before).

## genIntelliJRuns-generated run configs are erroring

(This probably doesn't happen in 1.13+, but it certainly does in 1.12-)

1. Open the Run/Debug configurations dialog (expand the run configs dropdown -> Edit Configurations...)
2. Under "Use classpath of module", change it to the one that ends in ".main"
3. Do this for each run configuration.

# Why

IntelliJ changed its model of how Gradle tasks are executed. Resources get put in a different folder from where ForgeGradle expects to find them, hot-swapping doesn't work, etc.

# Who

Thanks to Tama for figuring out the resources issue on MMD. Thanks to Paul Fulham for pointing out that it also breaks hotswapping and by "pointing out" I mean that he found out the hard way and had to find out how to fix it. I'm just posting this somewhere I can link to it.