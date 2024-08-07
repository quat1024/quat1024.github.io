slug=managing_java
title=How to download Java
author=quat
description=Every player who visits Oracle's website is a failing on behalf of the community.
created_date=Jun 4, 2024
updated_date=Aug 8, 2024
subject=java
---
Minecraft needs Java to run. After Java applets died, most of the remaining Java users were programmers, so a lot of the more recent documentation about how to use Java has shifted towards a programmerish audience. There's a lack of resources for everyday people. This document is an attempt at closing the gap.

# Getting Java

I'd like to present four methods of getting Java onto your system, each with their benefits and drawbacks. In order of "easiest but most restrictive" to "more complex but most flexible":

## 1. Just letting a launcher do it for you

Some launchers automatically provision Java installations, like [the official launcher](https://minecraft.net), [GDLauncher](https://gdlauncher.com/), [Lunar Client](https://www.lunarclient.com/) if you're in their ecosystem, and such. You can use one of these launchers and never have to think about installing Java.

There are two main drawbacks. First, and most obviously, I hope you like that launcher, because you tie yourself to it. The vanilla launcher in particular is very unfriendly to keeping your Minecraft installations separated, and it's hard to install modloaders into it.

Also, while these launchers let you pick from a few *major* versions (java 8, java 17, etc), you often can't change the *patch* version. The current version of Java 8 is Java 8u412, but the vanilla launcher still ships Java 8u51, which is almost ten years old, has [bugs](https://github.com/BluSunrize/ImmersiveEngineering/issues/1533), and ships [severely outdated SSL certs](https://github.com/MinimallyCorrect/TickProfiler/issues/115). Problems caused by this are rare, but if you stumble into one and your launcher doesn't provide the right version, you might need to install Java yourself.

## 2. Java installers

The easiest way to get Java is to run an installer. **By far, the best place to get Java installers is from [Eclipse Temurin](https://adoptium.net/temurin/releases/?os=windows&arch=x64&package=jdk).**

* Select your operating system and architecture. If you're not sure which architecture, pick `x64`.
* Under "Package Type", select JDK.
* Finally, select the major version of Java you want.
* Download the `.msi` installer and run it.

This works for a lot of people.

Here's a tip: pick a different folder than `C:/Program Files/Java`. Old versions of Minecraft need Java 8, newer versions require Java 17, and newer-still versions require Java 21, so if you want to play a variety of modpacks you'll want to have all these installed at the same time. In your Minecraft launcher, make sure to manually set the path to the Java executable as well. (I've heard of people reinstalling Java every time they switch versions - it doesn't have to be this way!)

## 3. Java zips

You don't really need to *install* Java to *use* it. Java is just a collection of files on your computer; in the `bin` folder you'll find `javaw.exe`, which is the file your Minecraft launcher runs to start Minecraft.

All "installing Java" does is add a file-association to your computer (so you can double-click on `.jar` files to run them) and modify a few environment variables (so you can run `java` in the command-line). You don't need any of this to play Minecraft. Instead, just manually tell your launcher where to find Java.

You can do this by heading to the [Eclipse Temurin](https://adoptium.net/temurin/releases/) website and downloading the "zip" instead of the installer. Extract it somewhere safe, and in your launcher's settings, tell it to use that JDK. This method is pretty simple and doesn't leave anything permanent on your computer. You can easily try new versions of Java, easily install multiple versions at the same time, and switch between them by changing the file path in your launcher's settings.

## 4. Package managers

Linux distributions typically have some "system" package manager, which is usually the best place to get maybe-outdated but largely-system-compatible versions of Java. Windows famously does not have a good package manager, but projects like Chocolatey and (my favorite) [Scoop](https://scoop.sh/) fill the gap. In particular, Scoop has a Java "bucket" which contains installable versions of every Java version I can think of.

You can install Scoop by following the directions on the home page + finishing with `scoop install git`, then `scoop bucket add java` followed by `scoop install temurin21-jdk` will keep it up to date. (Scoop internally needs a copy of `git` for its bookkeeping, since the "repository" is just a github repo; if you already have a working git on your system, you don't need to install one from Scoop.)

Benefits of this: There's a single interface for installing all sorts of Java versions; no need to open a web browser and track down the right website. There's somewhat better system integration (Scoop manages the system `PATH` in such a way that typing `scoop reset (some jdk)` will switch the program `java` refers to).

If you don't already use a system package manager, it's overkill to install one just to get Java. There's occasionally a need to download an older version of Java within the same major version (say, old versions of Java 8 before an SSL certificate update), and at least Scoop does not keep old versions of packages around. When you `scoop install temurin8-jdk` you will get the latest version of Temurin 8. Scoop provides support for switching back to old versions, but the old versions have to have already been downloaded by you.

# Rationale

#### Why Temurin and not Oracle?

Temurin's website doesn't beg you for passwords or license agreements.

Oracle's JDK and Temurin are both based off the OpenJDK open-source project. Oracle's JDK includes [a number of proprietary components](https://adoptium.net/docs/migration/), which are not relevant to Minecraft (and frankly not relevant to most people).

#### Why Temurin and not ____?

There are lots of other builds of Java based on the OpenJDK open-source project:

* You can download [directly from OpenJDK](https://jdk.java.net/). They only provide zips (no installers) and don't provide Java 8.
* You can download from Azul or Amazon or Microsoft or a bunch of other companies. Their builds differ from OpenJDK mostly in professional support opportunities and other things that aren't really relevant to Minecraft players.
* You can download GraalVM. Good luck using that.

I recommend Temurin because it's "plain", the website is decent, and it's the JDK I use on my personal computers.

#### Why the JDK, not the JRE?

Java is packaged into a Java Development Kit and a stripped-down Java Runtime Environment. The JDK is a superset of the JRE, and is about four times larger, comtaining a Java compiler and other assorted tools *mostly* relevant to developing Java programs.

The JRE is fine most of the time, but biting the bullet and downloading the JDK will prevent problems down the road:

* The JDK/JRE distinction dates from the applet days, where the download size mattered a lot more.
* To debug a slow game you might want to use a Java profiler like VisualVM. These need JDK-exclusive features.
* Some (hacky) mods leverage JDK-exclusive features like the `Instrumentation` API.
* And of course, if you ever get in to writing your own mods you'll need the JDK :)

So this is why I recommend the JDK.
