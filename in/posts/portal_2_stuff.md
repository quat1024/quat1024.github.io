slug=playing_portal_2
title=How to play Portal 2 without losing your mind
author=quat
created_date=May 06, 2021
updated_date=May 07, 2021
tags=games,portal2
subject=games
---
Ok so I want to collect all of the "things that 99% of the dedicated portal2 players use but noone ever really talks about" into one post I can point to. Here we go!

# Saves

`F6` and `F7` save and load the game. Not everyone knows this, but now you do!

# Console

The developer console is where you enter commands. It can be enabled in settings (under "Keyboard and Mouse"), and the default key to open the console is \` (backtick). You can also add the `-console` launch option to open the console when the game starts, useful in Portal Reloaded where the console isn't available for some reason.

If you create a file at `steamapps/common/Portal 2/portal2/cfg/autoexec.cfg`, every time you start the game, it will execute each line of the file as if you typed it in the developer console.

The console will show command completions, and the `find` command can be used to search through commands.

## Hey what's a bind

I'm going to talk about "binds" a lot. The in-game settings menu allows you to customize some keybinds, but if you open the developer console and use the `bind` command, you can bind things to *any* arbitrary command. Running `bind x "noclip"`, for example, will run `noclip` when you press `x`.

You can print a listing of all bindings with `key_listboundkeys`, and e.g. `unbind x` can be used to delete a binding. Multiple commands can be bound to the same key by separating them with `;` (a semicolon).

The in-game keybindings menu uses this bind system internally as well; enter `key_listboundkeys` and observe how it's already populated with a bunch of stuff.

To bind things to the mouse wheel, bind them to `MWHEELDOWN` or `MWHEELUP`. The numpad can be addressed with `KP_END` for 1, `KP_DOWNARROW` for 2, `KP_PGDN` for 3 etc.

## Useful cheats and bindings

I'll preface this by saying *everybody* cheats. Basically everyone has a keyboard full of their own cheat keybinds, and you'll be hard-pressed to find someone in the community who like, never cheats. This is a puzzle game first and foremost, it doesn't matter if you accidentally fell off a ledge and used noclip to get back on. As long as you had fun figuring out the puzzle and your solution would have worked without any noclip, it counts! (Don't go into p2 speedrunning with this mindset.)

If you're entering these into a `bind` command don't forget to wrap them in double quotes btw. And it's handy to prefix cheat commands with `sv_cheats 1;` so you don't need a separate "enable cheats" bind.

When playing in co-op, only Atlas can enable `sv_cheats`, but after that both players can use cheats.

With all that out of the way! Your bread-and-butter binds:

* `sv_cheats 1; noclip` - Toggle noclip, allowing you to fly through walls and outside the map.
	* Goo pits, bottomless pits, and laserfields will still kill you!!!
* `sv_cheats 1; god` - Toggle god mode, removing all damage.
	* Maybe a good idea to combine with the `noclip` bind
* `sv_cheats 1; ent_create_portal_companion_cube` - Spawn a companion cube in the wall at your crosshair position.
	* There are also commands like `ent_create_portal_reflector_cube` for laser cubes, `ent_create_portal_weighted_sphere` for spheres, etc. I don't have these bound to keys, but they're good to know about in case you need to spawn one.
* `sv_cheats 1; host_timescale 3` - Run the game at triple speed!
* `sv_cheats 1; host_timescale 0.25` - Run the game at quarter speed.
* `sv_cheats 1; host_timescale 1` - Run the game at normal speed again.
* `sv_cheats 1; toggle host_timescale 1 3 0.25` - One key to toggle between a bunch of game speeds, if you prefer that!
	* If you don't have sv_cheats on, `host_timescale` just changes the pitch of in-game audio, which is pretty funny
* `ent_fire !picker use` - "Long range Use". This acts the same as the E key, but doesn't have any distance limitations, so you can pick things up and press pedestal buttons from any distance.
	* Hilariously this is *not* a cheat command according to the game lol
	* It's not safe to *replace* your usual "use" key with this because there are lots of differences and bugs. But put it on an easy-to-reach key.
* `save XXXX` and `load XXXX`, with whatever filename you want - More save slots!
	* F6 and F7, the default quicksave keys, use the filename `quick`.

And some more specialized binds:

* `sv_cheats 1; buddha` - Toggle "buddha mode", where you can still take damage but can't actually die.
	* Useful to see *if* you are taking damange, since godmode removes the red overlay as well.
* `sv_cheats 1; notarget` - Toggle notarget mode. Turrets can't see you.
	* useful for really awful community maps
* `incrementvar crosshair 0 1 1;incrementvar r_drawviewmodel 0 1 1` - Toggle the crosshair and portal gun.
	* I have this on `F1` like Minecraft.
	* In some mods `r_drawviewmodel` doesn't remove all of the portal gun. Replace it with like, `viewmodel_offset_x 0 2000 2000` to move it way off screen instead.
	* Make sure to enable the HUD again before you exit a map, because `r_drawviewmodel` doesn't carry over between maps but `crosshair` does lol, just one of those things.
* `;+remote_view` (with a semicolon at the start) - "Sticky" partner view for co-op. Pressing this key opens the viewport of your co-op partner, but you don't need to hold it down to keep it open. It is safe to replace your usual partner view bind with this if you want; you can create a separate "disable remote view" bind with `;-remote_view` as well.
	* Putting a semicolon in front of any bind that starts with `+` will make it sticky. Usually not that useful except for this one.
* `jpeg` - Takes a screenshot!
* `cl_fov 110` (or whatever number) - Change the game's horizontal field-of-view.
	* Unfortunately you need to press this after every loading screen because the game resets it to 90.
	* Sometimes people bind their W key to `+forward;cl_fov 110`, so walking forwards, a thing you do anyway, resets the FOV.
	* Hot tip but reducing the field of view makes it easier to take nice screenshots, handy for thumbnails and stuff, so you might want to bind a few keys to `cl_fov 60` and such. I have the whole bottom-right of my keyboard dedicated to FOV-changing keys for posing screenshots.

## Uhhh more useful commands

Not really things that need to be bound to a key per se, but they're nice commands to know about. Look, I just wanna dump this info on you

* `mat_picmip <number>` - Increase the number to decrease texture resolution. Makes the game look like shit, but useful if your computer is a potato.
* `viewmodel_offset_x` - Changes the horizonal position of the portal gun on the screen. Positive values move it to the right. `2` looks nice on widescreen.
* `sv_player_collide_with_laser` - Setting a value of 0 removes damage and collision with lasers. You can just walk right through!
* `sv_use_bendy_model` - Setting a value of 0 makes you use the Chell player model in community maps, if you prefer to play as her.
	* It only takes effect on the next map load and doesn't stick between game sessions, so put it in your `autoexec.cfg`.
* `map` - Loads a map!
* `fadein` - Fades the screen back in, useful if you touched a bottomless pit with godmode and the screen faded to black.
* `phys_timescale` - Adjusts the speed of the physics engine. You can set it to `0` safely, causing objects to freeze in place. Useful for posing screenshots.
	* Hilariously this is also not cheat protected, don't use this in your speedruns lol
* `cl_showpos 1` - Show your position and angles in the upper left of the screen.
* `setpos` and `setang` - Set your position and angle exactly. Useful for lining up screenshots.
* `ent_fire !picker <way too many things to list here>` - There's tab-completion on this for the available options. Fires an input to the thing under your crosshair, causing something to happen to it. You can change the color, parent it to something, delete it... My favorite is `ignite` which makes it catch on fire
* `r_portal_use_pvs_optimization 0` - Stops the screen turning white when you noclip out of bounds then disable noclip. Doesn't seem to noticeably impact framerate.
* `+mouse_menu_playtest` - Unused co-op ping menu with thumbs-up, thumbs-down, ?, and ?!\* reactions. Broken in singleplayer and you will softlock if you press it!!!
* `restart_level` (DOES NOT APPEAR IN AUTOCOMPLETE FOR SOME REASON) - Restarts the current map. Unlike plain ol `restart`, doesn't act funny on community maps.

Okay next section!

# SAR and loading fixes

[SAR](https://wiki.portal2.sr/SAR) is a plugin/mod/tool/thing that Portal 2 speedrunners use. You can download the latest version [over here](https://github.com/Blenderiste09/SourceAutoRecord/releases). It's like 99% nerdy speedrunner stuff, but there is a *really* nice-to-have loading screen fix as well, that makes loading take *much* less time.

In particular this makes quicksaves fun and useful again: loading a quicksave created on the same map takes less than a second, on my PC.

Full installation instructions are available on the [Portal speedrunners wiki](https://wiki.portal2.sr/SAR#How_to_install) but in short, to enable the load remover:

* Download the `.dll` on Windows or `.so` on Linux. Uhh if you're on Mac, good luck!
* Put it wherever you want in `steamapps/common/Portal 2`. I have it right next to `portal2.exe`.
* Open your `autoexec.cfg` and enter:

```codeblock
plugin_load sar
sar_fast_load_preset normal
```

* You can write `full` instead of `normal` for even *faster* loads, but this disables all loading screen rendering, including things like the name of the community map.
	* Full details on loading presets [on the speedrunners wiki](https://wiki.portal2.sr/SAR#Loading_Fixes) of course.
* Start the game and enjoy speedy loading screens.

SAR also has a few more commands that might be useful to casual players. Put these in your autoexec under `plugin_load` as well.

* `sar_force_fov 110` - It's like `cl_fov`, but sticks around after map loads so you don't have to press your fov bind every time.
* `sar_autojump` - Makes you jump continuously while holding your jump key.

A full list of commands is available [here](https://github.com/Blenderiste09/SourceAutoRecord/blob/master/doc/cvars.md). There are a lot.

Oh and if you're curious it stands for "Source Auto Record", because the original purpose of the tool is to automatically record demos on the first tick of loading a map, but as you can see it's grown in scope quite a bit...

# BEEMOD

This is more for making maps and not playing them, but I want to point you in the direction of [BEEMOD](https://github.com/BEEmod/BEE2.4). It's a tool to customize the items available in Puzzlemaker. There's custom test elements, but also things like additional map geometry (wedges, blocks, holes-in-glass), more features for the vanilla map elements (you can enable Portal 1-style victory lifts that only move when you stand on them), more map themes, and more. All available in the in-game editor for you to use, no Hammer knowledge needed.

I will say a few things:

* Beemod's packages are a fairly big download, be prepared to wait.
* The custom styles are kinda ugly imo... I'm really sorry because there's a lot of work put into them, but the "Original Clean" style is still my favorite. It's the most readable.
* Due to limitations it's not possible for BEE to add new *types* of checkboxes to the editor. But they can take e.g. the "Auto-drop first cube" checkbox from cube droppers, graft it on to other items, and make it do something else. So the Portal 1-style victory lift setting I mentioned earlier is enabled by right-clicking a lift and enabling "Auto-drop first cube". It's very, very weird. You get used to it. Everything is documented in the BEEMOD application.
* The invisible logic gate items are useful for way more than logic gates! The gates might be invisible, but antline and signage connections to them are not. Be creative.
* Light strips now have a Cube Type. The first 3 change the temperature of the emitted light and the 5th makes an invisible light strip that blocks antlines. (4th is not used.)

# How do I bunnyhop?

Really really quick overview:

* Bind jump to your mousewheel. Scroll whenever you get close to the ground to input a jump as early as possible.
* Tap forward to get some initial speed, but once you have speed, move by strafing sideways instead of by walking forwards.

That's basically it.

There's wayyyy more detailed guides out there and I'm not an expert. It takes a lot of practice to get a "feel" for the right way to move and how momentum carries.

# Hey quat uhh, this is all well and good, but what maps should i actually play with these newfound powers

Well I'm glad you asked, because unfortunately, browsing the workshop by "Most Popular" is not a very good way to find high-quality maps\*.

A longtime Portal 2 friend curated this collection called ["Introduction to the Workshop"](https://steamcommunity.com/sharedfiles/filedetails/?id=470046703), which has *all* the classics. It's a bit old now but it's timeless, I always recommend it to new workshop players. You'll pick up all the puzzle techniques you'll need to solve community maps that aren't part of the main game (what?), and have a good time doing it.

All of the people included in that collection are fairly prolific mappers, so browse their profiles and check out their other work and their favorites lists as well.

Here's my list of [workshop favorites](https://steamcommunity.com/id/quaternary/myworkshopfiles?appid=620&browsesort=myfavorites&browsefilter=myfavorites&p=1), although it's mostly hard shit and kinda outdated by now...

\*It's mainly because completing a map prompts you with the rating screen, so maps with more completions get more popular, so easy maps rise to the top. Occasionally you'll find bangers in there but like, approach it the way you'd approach Mario Maker's popular section.

Now go forth!