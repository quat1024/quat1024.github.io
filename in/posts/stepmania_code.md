slug=stepmania_code
title=Let's look at Stepmania's code
author=quat
description=A look at the oldest dance game codebase.
created_date=Apr 02, 2023
tags=games,stepmania
---
StepMania is a nearly-old-enough-to-drink piece of software by the dance game community. It's impossible to succinctly describe, it is everything and nothing at the same time - it was originally designed as a PC-based clone of Dance Dance Revolution but the code has found its way to game consoles too, and even circled its way right back into the arcade, it's open-source but also closed-source, it has been worked on by countless groups and communities and collectives and people and basically the only constant is that it's a labor of love.

# Stepmania history

Some places to look:

* [Jose Varela's StepMania build archive](https://josevarela.net/SMArchive/Builds/)
* I recommend downloading 3.9 from the archive; `stepmania/NEWS` contains a changelog stretching from 3.02 all the way back to Stepmania 0.5. The changelog file itself doesn't include dates but you can crossreference with dates on Jose_Varela's archive.
* the [Spinal Shark Collective website](https://ssc.ajworld.net/), still up haha
* [stepmania/stepmania](https://github.com/stepmania/stepmania):
	* Mostly includes the SSC's work. The "Initial commit" is from 2010-01-26 and is a lie; it's just the import date into the SSC's repo.
	* [Stepmania 5_1-new's `docs` folder](https://github.com/stepmania/stepmania/tree/5_1-new/Docs) is very nice and contains many changelogs
		* `Changelog_sm-ssc.txt` is sm-ssc development from 2009-04-18 to 2011-04-30. `old_changelog.txt` is just a subset running to 2009-12-08
		* `Changelog_sm5.txt` is Stepmania 5.1 development from 2011-04-30 to 2018-08-02
	* The [git history](https://github.com/stepmania/stepmania/commits/5_1-new) contains development from the import date to 2022-11-14 of course.
	* Wiki page about [version history](https://github.com/stepmania/stepmania/wiki/Versions) is nice
* if you're a CVS wizard, the [old Stepmania CVS repository on SourceForge may be of interest](http://stepmania.cvs.sourceforge.net/stepmania/stepmania/)
* if not, [openitg/stepmania](https://github.com/openitg/stepmania) is a GitHub mirror of some pre-2010 Stepmania development history (up to 3.90)
* I'm sure there's some forum threads lying around that'd be useful history

The general dates in question (sourced mainly from Varela's archive):

* "DDR PC Edition"/StepMania 0 - August to December 2001
* Stepmania 1.x: early 2002
* Stepmania 3.0: mid/late 2002
* Stepmania 3.9: mid 2003 - late 2005
	* The archive includes many forks like Xbox/PSP/Wii ports, Mungyodance, "Stepmania AMX", and other silliness
	* commercial ITG 1: 2004
	* ([*Konami Corp. v. Roxor Games Inc.*](https://en.wikipedia.org/wiki/Konami_Corp._v._Roxor_Games_Inc.): 2005 - 2006)
* Stepmania "3.95": mid 2005. This [was a CVS snapshot](https://github.com/stepmania/stepmania/wiki/versions#unofficial) and never received a formal release.
	* OpenITG: 2008 to 2009
		* "In The Groove 3": 2010ish
		* NotITG: late 2016 - **present**
* Stepmania "4": 2005 - 2011. Also an unreleased CVS snapshot.
	* [Apparently had troubled development](https://github.com/stepmania/stepmania/wiki/versions#unofficial); the later "sm4 snapshot" versions made far more conservative changes.
	* `sm-ssc` (forked off the more outlandish incarnation of Stepmania 4): 2009 - 2011
* `sm-ssc` assumes the "official" Stepmania 5 branding in 2011; betas, alphas, and test releases occur 2011 - 2015
* Stepmania 5.0: 2015 - 2016
	* Club Fantastic [("CFSM")](https://wiki.clubfantastic.dance/en/Changelog#h-11122020-release-3): 2020 - **present**
	* Etterna: 2016 - **present**
* Stepmania 5.1 (on branch `5.1-new`): releases made 2016 - 2018, work continued through late 2022
	* Outfox: 2019 - **present**
	* ITGmania: 2022 - **present**
* Stepmania 5.2? 👻

And a short description of some of these spinoff projects:

* OpenITG: "3.95" fork that attempts to be a clone of the commercial ITG software, intended to be installed both at home and on ITG arcade hardware
* NotITG: OpenITG fork that adds many more attacks, Lua functions, and visual capabilities; grew out of the course-file community
* `sm-ssc`: "4" fork with the main goal of Adding A Bunch Of Stuff™, primarily to allow for easier and more flexible theming but also to expand gameplay capabilities, by-and-for the theming community
* Club Fantastic: Small stepmania 5.0 fork but the main attraction is the content package, aimed at beginners and experts to the post-ITG community
* Etterna: Stepmania 5.0 fork aimed at the keyboard rhythm game community
* Outfox: Stepmania 5.1-new fork aimed at the general rhythm game community
	* goals include adding and fixing up support for more types of rhythm game (guitar hero, paraparaparadise, taiko, donkey konga??) and bringing the game to new platforms
* ITGmania: Stepmania 5.1-new fork aimed at the post-ITG community
	* goals include making engine changes that were formerly hackily implemented in programs like the GrooveStats Launcher or in popular in-community themes like Simply Love, like held-miss tracking and integrated GrooveStats score submission

All of the holdout 5.1-new/5.2 developers seem to be busy on Outfox or ITGmania. Stepmania is dead, long live Stepmania.

Ok, that's enough context. What's in this thing.

# Directory tour

The `src` folder contains most of the game's source code in a single, flat directory structure. I'll go over the handful of subdirectories first.

## `arch` and `archutils`

Simple platform abstractions. When Stepmania wants to display a `LoadingWindow`, for example, there are implementations using the Windows API, GTK, Mac, some older versions have Cocoa and SDL implementatons... `arch_default.h` contains the necessary preprocessor magic to include the right files on the right platforms. `arch/ArchHooks` has a bunch of one-off methods that require different implementations on each platform, like "opening a URL in the browser".

## `smpackage`

This goes wayyyy back, at least earlier than 1.64. The original StepMania author envisioned a Stepmania-specific content package format. Quoting `README-first.html` in the 3.0 download:

> The StepMania package format was created to make the distribution of songs and other add-ons very easy.  StepMania package files have the extension '.smzip' and can be installed by double-clicking the .smzip file.
> 
> A StepMania package is 'installed' by extracting all files in the package to the StepMania program directory. This allows songs, courses, themes, and visualizations to all be installed by the Package Manager.
> 
> The file format of an .smzip file is actually the PK-Zip standard.  This means you can rename any .smzip file to have the extension '.zip', and then open the file in any compression application (e.g. WinZip, WinRAR).
> 
> The StepMania Package Exporter (smpackage.exe) can create packages of your song, announcers, themes, or other add-ons. Simply launch the Package Exporter (Start Menu->Programs->StepMania->Package Exporter), click the items you would like to make into a package, then click the one of the Export buttons. "Export as One" will take all of the selected items and make one package that contains them all. "Export Individual" will create one separate package for each selected item in the list.

This didn't catch on much with the community - off-the-shelf zip programs turned out to be good enough - and `smpackage` is no longer a separate program, but you might find a lingering `.smzip` file association on your Windows computer.

Cutely, a revised version of this scheme is still listed as a ["future project"](https://github.com/stepmania/stepmania/wiki/SMPackage) on the Stepmania 5 wiki.

## Horribly outdated stuff

* the `irc` directory in 5.1-new contains an IRC bot that I think belonged to the 3.95 team? Their CI would invoke this whenever it builded a new release.
* `update_check` contains a PHP script?!
* `verify_signature` contains various 2004-era programs by Chris Danford to check file cryptographic signatures, in C++, C#, and Java, probably to test the new cryptographic library being switched to at the time.
* Stepmania adopted CMake in 2015. Before that, headers to assorted third-party libraries (and sometimes the `.lib` itself!) were included in the `src` tree. There are still a few third-party libraries in there as of 5.1-new; specifically `libtomcrypt` and `libtommath`

# Top-level source concepts

## "Rage"

This is a light "game engine", no relation to the one from Rockstar, dating to at least earlier than Stepmania 1.64.

Input devices and joysticks, math (including matrix math), filesystem, sound playback, image loading, etc, will often be implemented in classes starting with the word `Rage`.

## Lua bindings

Generally when something is exposed to Lua, the glue code listing the exposed fields and methods will be written at the bottom of the `.cpp` file. The glue is implemented in `LuaBinding.h`/`.cpp`. SM3.9 doesn't expose Lua bindings.

# Ok how does this engine work

In this section when I refer to "the theme", I'm also referring to "any scripting gunk that might be contained in a modded simfile"; mod files work by placing actors and scripts on the screen just like with theming.

I will be comparing:

* [openitg/stepmania](https://github.com/openitg/stepmania/tree/tags/v390release), tag `v390release`
* [openitg/openitg](https://github.com/openitg/openitg), branch `master`
* [stepmania/stepmania](https://github.com/stepmania/stepmania/tree/5_1-new/src), branch `5_1-new`, which I might call "SSC" for short

⚠ There's gonna be some stuff where I'm like "oh this was added in OpenITG", but it was actually added in to Stepmania "3.95", in the interim between `v390release` and OpenITG's fork point. I don't know exactly which CVS version of Stepmania OpenITG forked off of and I'm just clicking around looking for convenient tags to browse on Github anyway.

## Actors

(TODO: cover updating/drawing cycle, at least for comparison with Screen)

What is an actor? A miserable pile of secrets. quietly-turning [describes them so](https://quietly-turning.github.io/Lua-For-SM5/LuaAPI#Actors):

> Actors are the basic building blocks used to script content for StepMania. When the player sees and interacts with something on-screen, like a menu system or a 3D model of a dancing character, that *something* is an actor.

There's an actor for displaying rectangles (`Quad`), text (`BitmapText`), images and video (`Sprite`), the groove radar used in some themes (`GrooveRadar`), the arrow playfield (`Player`), a copy of another actor (`ActorProxy`), and if you generalize the notion of "something you can see" you'll find actors that contain other actors (`ActorFrame`), actors that play sounds (`ActorSound`), and so on and so on and so on. Actors all the way down.

Some actors are very general-purpose (like `Sprite`) and are mainly configured through the theme. Other actors (like `Player`) mainly end up configured through the C++ engine code. A given Screen might create a few actors, or it may expect the theme to have placed down actors with specific names and types in order to function (you can imagine `ScreenGameplay` is not very interesting without any `Player` actors, right). I will talk about Screens later.

Each actor has a "tween state", which includes an x/y/z position, pitch/yaw/roll rotation, x/y/z scale ("zoom"), X and Y skew, four crop amounts (one for each edge), four fade amounts and diffuse colors (one for each corner), and a glow color. The tween system allows the theme to set any of these properties, animate them over time, and query their current value - because they can be queried, SSC also adds an "aux" variable to the mix, allowing the tween system to be used to drive an arbitrary float. (Each actor can also have "effects" applied to it, which are rudimentary animations that accomplish a similar thing to the tween system.)

Additionally, each actor has:

* a name (string), and in 3.9, also an ID string
* in SM5, an optional parent actor
* base rotation and scale
* a "first update" flag
* horizontal and vertical alignment settings
* a draw order (imagine CSS's `z-index`)
* a "hidden" flag
* a blending mode
* a texture wrapping flag
* a culling mode
* and some things to do with the zbuffer:
	* a flag to erase the whole zbuffer when drawing this actor
	* a flag to ignore the zbuffer when drawing this actor
	* a flag to avoid writing to the zbuffer when drawing this actor
	* (sm5) a zbuffer bias

Basically there is "a lot" of stuff stored for each actor - enough to position and animate it anywhere you like, and a couple of mildly advanced rendering abilities.

### Commands

In general, a "command" is a short *program* that goes into a *named slot*. When you call a command on an actor, it will run the program, and bubble the command downwards into each of its child actors.

Some examples of what the command system is used for:

* `Init`, invoked on an actor immediately after loading it
* `On`, invoked when the screen the actor's on becomes the active screen
* `Off`, invoked when that screen is no longer the active screen

The implementation is pretty different in SM3.9 and in OpenITG/SM5.

#### SM3.9

A command is a semicolon-delimited list of tween instructions. Commands are always stored in `metrics.ini`. [Here's one from the Stepmania 3.9 default theme](https://github.com/openitg/stepmania/blob/tags/v390release/stepmania/Themes/default/metrics.ini#L132):

```ini
[ScreenSelectStyle]
# ...
PremiumOnCommand=addx,400;bounceend,0.5;addx,-400;glowshift;effectcolor1,1,1,1,0;effectcolor2,1,1,1,0.3
```

When calling a command on an actor, [the engine will](https://github.com/openitg/stepmania/blob/tags/v390release/stepmania/src/ActorUtil.cpp#L305):

* build a string by concatenating the actor's ID + the name of the command to call + the word "Command"
* look it up in the section of `metrics.ini` corresponding to the current screen's name
* parse the result as a list of instructions.

(This command would be found when executing the `On` command, on the actor with ID `Premium`, while on the screen named `ScreenSelectStyle`.)

SM3.9 has [decently big list of instructions](https://github.com/openitg/stepmania/blob/tags/v390release/stepmania/src/Actor.cpp#L636) that can be applied to actors. `ActorCommands.cpp` `ParseCommands` parses this string into a `vector<ParsedCommand>`; there are six `ParsedCommand`s in this example string, separated by semicolons. When the actor executes this command, it will move 400px to the right, set the tween mode used for further commands to `bounceend` over half a second, move 400 pixels back to the left, play the `glowshift` effect, and configure that effect's colors.

Note that the list of instructions may change per-actor type; it's a virtual function, actor implementations can override it to respond to more commands.

It is limited because while there's a lot of options, all you can do is punt around the variables on the actor.

#### OpenITG

OpenITG (probably actually 3.95) added two things:

* the ability to load screens (and therefore, actors) out of an XML file, instead of hardcoding the entire actor layout in each screen's C++ code;
* a Lua API to configure the actor's properties.

Commands are now stored *on the actor itself*, in a map indexed by the command name. When loading an XML actor, if there's an XML attribute with a `Command` suffix, the prefix of the string is used as the name, and the text is parsed as a command.

Commands are always Lua functions. OpenITG added a Lua API to configure the same things the old command system could configure.

The [command parser](https://github.com/openitg/openitg/blob/master/src/ActorCommands.cpp) became much stranger. If the command string starts with `%`, it is replaced with `return `, and the resultant string is returned. This lets you write Lua functions as a command, like this one from the [OpenITG theme metrics.ini](https://github.com/openitg/openitg/blob/f2c129fe65c65e4a9b3a691ff35e7717b4e8de51/assets/d4/Themes/default/metrics.ini):

```ini
ScrollerOnCommand=%function(self) self:z(-200); self:SetDrawByZPosition(true) end
```

If it doesn't start with a percent sign, the string is assumed to be a command in the SM3.9 format, and the engine will *update it* into a Lua function:

* First it's parsed using [Command::parseCommands](https://github.com/openitg/openitg/blob/f2c129fe65c65e4a9b3a691ff35e7717b4e8de51/src/Command.cpp#L69), which splits the string on semicolons and stores all commas as "arguments"
* but it then [uses some string-munging](https://github.com/openitg/openitg/blob/master/src/ActorCommands.cpp#L7) to replace commands like `addx,400` with strings like `self:addx(400); `!
* It does this for all commands, adds `return function(self,parent)` at the beginning and `end` at the ending, and returns. The command string has been successfully converted into a Lua function.

It's still possible to define commands with the metrics system - if the actor does not define a command with the given name, [`metrics.ini` will be checked for the command](https://github.com/openitg/openitg/blob/f2c129fe65c65e4a9b3a691ff35e7717b4e8de51/src/ActorUtil.cpp#L377-L379). Commands can be defined using either format (list-of-tweens or a Lua function) in either location (on the actor or in `metrics.ini`)

#### SM5

Similar to OpenITG. The string munger is moved to [LuaHelpers::parseCommandList](https://github.com/stepmania/stepmania/blob/984dc8668f1fedacf553f279a828acdebffc5625/src/LuaManager.cpp#L901), which also handles the `%` syntax.

SM5 also added the ability to create actors from a Lua file. When converting a Lua table to an actor, properties ending with `Command` may be directly set to Lua functions (no string-roundtrips or % signs required).

### Messages (not in SM3.9)

Commands are per-actor; you dispatch a command *on* an actor, and it trickles the command dispatch down through the actor tree.

Messages, on the other hand, are global. The message manager is a global object, anything can subscribe to be notified of a message, and anything can broadcast a message.

It's possible to define "message commands" on an actor (remember that actors are only one type of message listener). There isn't a single concept of "message command"s in the game code, they are simply an interaction of the command system and the message system:

* you add `BlahMessageCommand="%hi()"` to your actor xml
	* the command system sees the XML attribute ending in the word `Command`, removes the suffix (leaving `BlahMessage`), and parses the command
	* it considers adding the command under the name `BlahMessage` --
		* ah, but it notices the name ends in the word `Message`, so it removes that suffix too (leaving `Blah`), and tells the message manager it's interested in hearing the message `Blah`
	* the command is actually added under the double-stripped name `Blah`

Then, when something broadcasts `Blah`:

* the message manager will look up the list of message-subscribers interested in hearing about `Blah`
* if it's not empty, it will notify each one in turn
	* the actor hears the message
	* the actor looks up the command under `Blah`
	* if one exists, the actor will execute the command

Messages can't have arguments. If there's some data to be posted along with a message, the convention is to stick it in a global variable somewhere before posting the message.

The message system is how [DivinEntity](https://github.com/DivinElegy/DivinEntity/blob/9eb41fb769bb14e26def6d5134a03ec0770326c9/NoteSkins/dance/DivinEntity/Left%20Tap%20Note%204th.xml#L160-L185) was able to communicate data about which arrows were being pressed to any simfile who would listen. (NotITG now broadcasts the messages from the engine.)

Worth noting that `QueueCommand` is a tween instruction that invokes a command on itself when being evaluated. Similarly, `QueueMessage` is a tween that broadcasts a message over the message manager when being evaluated.

## quick diversion into input types

* `DeviceInput` - This is a "lower level" input event defined in `RageInputDevice.h`. It is a keyboard press, joystick wiggle, or whatnot.
* `GameInput` - "An input event specific to a Game definied by an instrument and a button space.". For example, `DANCE_BUTTON_LEFT`.
* `MenuInput` - Menu navigation inputs, such as MenuLeft and MenuRight, start and select, and the "button" that's pressed whenever a coin is inserted into the arcade machine.
* `StyleInput` - Column-specific game input - this is just a tuple of (player number, column).

Annoyingly there is overlap between them - there is `DANCE_BUTTON_COIN` in `GameInput` as well as `MENU_BUTTON_COIN` in `MenuInput`. Even things like `DANCE_BUTTON_MENULEFT`. I dunno.

## Screens

A `Screen` is a type of `ActorFrame`, which tells you a bit about what they are - a screen contains zero or more actors.

Screens update every frame, and receive a method call whenever an input event happens. There is also a notion of a "transparent" screen (where screens below it need to be drawn first - more on that with the screen manager), and a screen message system (unrelated to the OpenITG message manager). Screen messages can be posted now or take place in the future. They are generally things like "the menu timer expired", "go to the next screen", "go to the previous screen", "stop playing music" etc.

## The screen manager

The screen manager maintains a *stack* of screens. Screens can be pushed onto the stack or popped off. The "top screen" is considered to be the one with focus. When pushing a screen onto the stack (or when replacing the screen with a new one), the `SM_LoseFocus` screen message is posted to the old screen, and `SM_GainFocus` is posted to the new screen.

The stack system is not used much. It's not that "song select opens the gameplay screen on top of it", it's used more for things like the Ok/Cancel dialog that shows up to confirm your autosync result. That's a screen.

The screen manager can also *prep* a screen, which constructs and initializes it (getting all its actors in place, calling the `Init` command on all of them, etc) without actually making it the top screen yet. The purpose of this is to prepare screens that will be used very shortly, like how `ScreenGameplay` will almost always be used after `ScreenSelectMusic`, so might as well prep it now.

There's yet another thing called a "message" - "system messages" are fortunately not too much fancy, they're for debugging toasts. As usual, in SM3.9 the actor responsible for showing the toast onscreen was hardcoded in C++, and OpenITG punts it to the theme; it sets a global variable then broadcasts `SystemMessage`.

## XML actors and screens

SM3.9 had a pretty simple notion of screens. The C++ constuctor would initialize all the screen's actors, put them in the ActorFrame, and that was that.

OpenITG's system of loading screens from XML added much more complexity. In OpenITG, I thiiiiink the entrypoint is `ActorUtil::MakeActor`, which is sometimes called from `ScreenManager`?

* Give it an `.xml` file, it will call `LoadFromActorFile`, which I will get back to.
* There's something for `.actor` files, I can't tell exactly what it does (both ini and xml??) but it will call `LoadFromActorFile` with some xml in the file apparently.
* Give it a directory, it will call `LoadFromActorFile` on the `default.xml` file inside the directory.
	* If that file doesn't exist, it'll give you a `BGAnimation` actor from the `BGAnimation.ini` file inside the directory.
* Give it a bitmap (png, jpg, gif, bmp), movie (avi, mkv, mp4, mpeg, mpg), or sprite (sprite), it'll give you a `Sprite` actor set to the graphic.
* Give it a 3d model (txt, model), it'll give you a `Model` actor set to the model.
	* Yeah, `.txt`. Apparently it has a Milkshape 3d model loader.

`LoadFromActorFile` is the meat and potatoes, the rest is convenience for setting up a (not configurable...) actor - nothing you couldn't do by manually making a `Sprite` actor from XML. So let's look at that instead.

* First, if the root node has an attribute `Condition` and, evaluated as a Lua function, it didn't return `true`, immediately cancel loading the actor.
	* This is a very rudimentary way of making actors disappear under certain conditions.
* Look for the attribute `Class` to pick the archetype of the node. (`Type` is allowed "for backwards compatibility".)
* Look for the attribute `File` and assert it's non-empty.
* "backward compatibility hacks":
	* if a `Text` attribute exists instead of `Class`, set the archetype to `BitmapText`
	* if the `File` is set to `songbackground`, `songbanner`, or `coursebanner`, set the archetype accordingly (these do not correspond to real actors)
* If an actor type with that archetype exists, call `ActorUtil::Create`, passing the XML.
* If not:
	* if the archetype was `songbackground`, `songbanner`, or `coursebanner`, create `Sprite` actors with the relevant image file
	* if not, call `MakeActor` on the value of `File`

Or, simplifying for the common case without the funny special-cases and conveniences:

* if the root node has an attribute `Condition` and it evaluates to a falsy lua function, stop
* look for the attribute `Class` to pick the archetype of the node
* look for the actor of that archetype, call `ActorUtil::Create`
* due to haha funny macro stuff (`REGISTER_ACTOR_CLASS(_WITH_NAME)?` in `ActorUtil.h`), this leads to constructing the actor (with the `new` keyword), calling `LoadFromNode` on it with the xml, and returning it

For `ActorFrame`s, well first when you make it with XML you actually get a slightly different `ActorFrameAutoDeleteChildren` instance, but its `LoadFromNode` method will recurse into the XML structure and call `ActorUtil::LoadFromActorFile` again.

TODO: What I'm struggling to find is what connects Screens and Actors. The only method that looks in the screen registry is `ScreenManager::MakeNewScreenInternal`, which constructs the screen with the given archetype and (in the `REGISTER_SCREEN_CLASS` macro) calls `init`. I think this is the wrong place to look and the lua stuff is actually in `BGAnimations` with the underlay/overlay system?