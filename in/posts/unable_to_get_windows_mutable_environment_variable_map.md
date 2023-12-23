slug=unable_to_get_windows_mutable_environment_variable_map
title="Unable to get Windows mutable environment variable map"
author=quat
description=Old gradle, Java 16, $JAVA_HOME, and you
created_date=May 26, 2021
tags=java,mc-modding
subject=java
---
I'm gonna tell a debugging story. It involves Gradle, Windows, Java 8, Java 16, and a funky package manager.

Okay, time to update my Gradle wrapper from an ancient Gradle 4 to the latest version as of writing this, Gradle 7.0.2.
```console
$ ./gradlew wrapper --gradle-version 7.0.2

FAILURE: Build failed with an exception.

* What went wrong:
Unable to get mutable Windows environment variable map

* Try:
Run with --stacktrace option to get the stack trace. Run with --info or --debug option to get more log output. Run with --scan to get full insights.

* Get more help at https://help.gradle.org
```
Hm.

I googled for this error and, while several people have had this problem (including a few fellow Minecraft modders), nobody had posted a solution. Time to debug it myself.

Let's try `--stacktrace`.
```console
$ ./gradlew wrapper --gradle-version 7.0.2 --stacktrace

[same error as before]

* Exception is:
net.rubygrapefruit.platform.NativeException: Unable to get mutable Windows environment variable map

		[big stacktrace]
		
Caused by: java.lang.reflect.InaccessibleObjectException: Unable to make field private static final java.util.Map java.lang.ProcessEnvironment.theCaseInsensitiveEnvironment accessible: module java.base does not "opens java.lang" to
unnamed module @7dc36524
        at java.base/java.lang.reflect.AccessibleObject.checkCanSetAccessible(AccessibleObject.java:357)
        at java.base/java.lang.reflect.AccessibleObject.checkCanSetAccessible(AccessibleObject.java:297)
        at java.base/java.lang.reflect.Field.checkCanSetAccessible(Field.java:177)
        at java.base/java.lang.reflect.Field.setAccessible(Field.java:171)
        at net.rubygrapefruit.platform.internal.WrapperProcess.getWindowsEnv(WrapperProcess.java:124)
```

Some stuff about modules, accessibility... What version of Java is this thing running on, again?

```console
$ ./gradlew --version

------------------------------------------------------------
Gradle 4.10.2
------------------------------------------------------------

Build time:   2018-09-19 18:10:15 UTC
Revision:     b4d8d5d170bb4ba516e88d7fe5647e2323d791dd

Kotlin DSL:   1.0-rc-6
Kotlin:       1.2.61
Groovy:       2.4.15
Ant:          Apache Ant(TM) version 1.9.11 compiled on March 23 2018
JVM:          16.0.1 (AdoptOpenJDK 16.0.1+9-202105072336)
OS:           Windows 10 10.0 amd64
```

Java 16 - yeah, that would do it. Frustrating. I do have both Java 8 and Java 16 installed on my computer (through [scoop](https://scoop.sh/), a Windows package manager), so this looks like a matter of telling Gradle which version to use.

Let's determine how the Gradle wrapper script, `gradlew`, discovers the Java command to use.
```shell
# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
    fi
else
    JAVACMD="java"
    which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.

Please set the JAVA_HOME variable in your environment to match the
location of your Java installation."
fi
```

If the `JAVA_HOME` variable is set, it checks there first, otherwise it looks for `java` on the path.

Sure enough:
```console
$ echo $JAVA_HOME
C:\Users\quat\scoop\apps\adopt16-hotspot-nightly\current
```

I'll change it to where my Java 8 installation is:
```console
$ export JAVA_HOME="C:\Users\quat\scoop\apps\adopt8-hotspot\current"

$
```

Let's try it:
```console
$ ./gradlew wrapper --gradle-version 7.0.2
Starting a Gradle Daemon, 2 incompatible Daemons could not be reused, use --status for details

FAILURE: Build failed with an exception.

* Where:
Build file 'G:\Dev\fabric\carvedmelons\build.gradle' line: 2

* What went wrong:
An exception occurred applying plugin request [id: 'fabric-loom', version: '0.8-SNAPSHOT']
> Failed to apply plugin [id 'fabric-loom']
   > You are using an outdated version of Gradle (4.10.2). Gradle 7 or higher is required.
     You are using an outdated version of Java (8). Java 16 or higher is required.
     The JAVA_HOME environment variable is currently set to (C:\Users\quat\scoop\apps\adopt8-hotspot\current).

* Try:
Run with --stacktrace option to get the stack trace. Run with --info or --debug option to get more log output. Run with --scan to get full insights.

* Get more help at https://help.gradle.org

BUILD FAILED in 5s
```
Different error, so hey, that's something!

Here we have a chicken-and-egg problem. I wanted to update my wrapper in the first place, because the version of the plugin I was using, `fabric-loom` version 0.8, isn't happy with Java 8 anymore.

But the plugin's error is preventing the wrapper-update script from running in the first place.

I'll resolve this by cheating, and renaming my `build.gradle` to like, `build.gradle.old` or something. Try again.

```console
$ ./gradlew wrapper --gradle-version 7.0.2
> Task :wrapper

BUILD SUCCESSFUL in 1s
1 actionable task: 1 executed
```

Well that took a suspiciously small amount of time, did it work?
```console
$ ./gradlew --version

------------------------------------------------------------
Gradle 7.0.2
------------------------------------------------------------

Build time:   2021-05-14 12:02:31 UTC
Revision:     1ef1b260d39daacbf9357f9d8594a8a743e2152e

Kotlin:       1.4.31
Groovy:       3.0.7
Ant:          Apache Ant(TM) version 1.10.9 compiled on September 27 2020
JVM:          1.8.0_292 (AdoptOpenJDK 25.292-b10)
OS:           Windows 10 10.0 amd64
```

Looks like it did!

Finally I can put back my `build.gradle`, and reset my JAVA_HOME to point at Java 16. Success?

## Things that didn't work

Initially tried to change my system PATH to put the `adopt8-hotspot` version before `adopt16-hotspot-nightly`, but that didn't work. I wasn't familiar with the `JAVA_HOME` variable and that's the one the gradle wrapper script checks first.

I also tried editing environment variables through the Windows "edit system environment variables" dialog, but I'm not sure when the "git bash" environment picks up on those changes...? I tried everything short of restarting my computer and changes to `JAVA_HOME` through the dialog didn't seem to be reflected. I don't know if there's another script resetting it to the adopt16 path lying around somewhere, or caching, or if I need to restart, or what.

## Oh

A friend mentioned that you can change `distributionUrl` in `{project root}/.gradle/wrapper/gradle.properties`. That might be an easier and less error-prone way to update Gradle. Ah well.

## Takeaways

So really, I discovered that running Gradle tasks from the terminal ran then in Java 16, but running tasks from IntelliJ ran them in Java 8.

The Java version used to run IDE tasks can be changed in `Build, Execution, Deployment > Build Tools > Gradle`. It can be set to read from `JAVA_HOME`, the `PATH`, or use a hardcoded Java path on your computer.

* The module system introduced in Java 9 has brought nothing but suffering into the world.
* Pain, pain and suffering.
* Always scan stacktraces for "module"-related issues, because random reflection-related crashes are almost always caused by Java 16.
* Having both Java 8 and 16 installed on your computer is:
	* useful,
	* *"fun"*,
	* probably neccesary for dealing with old Java crap - I dunno what I'd do if I didn't have a Java 8 installation lying around.
	* Maybe I should get one of those "java version manager" programs?
* Renaming build.gradle makes gradle not pick up on it. Good to keep in the back of my head.

# Hey uh, wait, Loom is still crashing

Now the blogpost transitions from "debugging a Gradle issue" to "debugging Loom", because I'm updating an old Minecraft mod and it's, uh, it's still not working.

First two issues:

* Loom whined about getting ran on Java 8 again, so I checked `Build, Execution, Deployment > Build Tools > Gradle` in IntelliJ and set Gradle to run on Java 16 from there as well. (There's an option to make it use whatever Java's in `JAVA_HOME`.)
* Gradle complained about insecure Maven repositories. If you cloned from `fabric-example-mod`, just open settings.gradle and change `'http://maven.fabricmc.net/'` to start with `https://`. Or wherever the repo links happen to be in your setup.

Now what:
```console
A problem occurred evaluating root project 'carvedmelons'.
> Could not find method modCompile() for arguments [net.fabricmc:fabric-loader:0.11.0] on object of type org.gradle.api.internal.artifacts.dsl.dependencies.DefaultDependencyHandler.
```

This is because: some time between Gradle 4 and 7, they removed the "compile" method and renamed it to "implementation". Loom folowed suit, renaming "modCompile" to "modImplementation". Perform that rename in your buildscript.

Crossing my claws:
```console
BUILD SUCCESSFUL in 45s
```

Cool.

# Wait one more thing

I tried to run `build` to produce a release .jar and it said something about fabric.mod.json and "duplicates". Another Gradle 4 to Gradle 7 mess.

In the buildscript's `processResources` block, change this:
```groovy
from(sourceSets.main.resources.srcDirs) {
	include "fabric.mod.json"
	expand "gradleversion": project.version
}
```

to this:
```groovy
filesMatching("fabric.mod.json") {
	expand "version": project.version
}
```

And you're golden.