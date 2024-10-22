slug=playing_portal_2
title=How to play Portal 2 without losing your mind
author=quat
created_date=May 06, 2021
updated_date=Oct 22, 2024
tags=games,portal2
subject=games
---
So I want to collect the things 99% of the experienced portal2 players know, but noone ever really writes down, into one post I can point to.

# Saves

`F6` and `F7` save and load the game.

# Console

The developer console is where you enter commands. It can be enabled in settings (under "Keyboard and Mouse"), and the default key to open the console is \` (backtick). You can explore what commands are available by experimenting with the auto-completion and using the `find` command.

Portal Reloaded doesn't have the console key listed in that menu (for some reason). You can add the `-console` launch option to open the console when the game starts.

If you create a file at `steamapps/common/Portal 2/portal2/cfg/autoexec.cfg`, every time you start the game, it will execute each line of the file as if you typed it in the developer console.

## Binds

The in-game settings menu allows you to customize *some* keybinds, but if you use the `bind` command, you can make keys perform *any* arbitrary command. Running `bind x "noclip"` will run `noclip` when you press `x`. Binds are persistent and will stick around after you quit the game.

You can print a listing of all bindings with `key_listboundkeys`, and `unbind [key]` can be used to delete a binding. You can see how the in-game keybindings menu uses the bind system too, because there's already lots of assigned keys.

To bind things to the mouse wheel, bind them to `MWHEELDOWN` or `MWHEELUP`. The numpad can be addressed with `KP_END` for 1, `KP_DOWNARROW` for 2, `KP_PGDN` for 3 etc. Multiple commands can be bound to the same key by separating them with `;` (a semicolon).

### Useful binds

I'll preface this by saying *everybody* cheats. Basically everyone has a keyboard full of their own cheat keybinds, and you'll be hard-pressed to find someone in the community who never cheats. This is a puzzle game first and foremost, it doesn't matter if you accidentally fell off a ledge and used noclip to get back on, or used timescale to speed up walking into the test chamber.

It's handy to prefix cheat commands with "`sv_cheats 1;`" so you don't need to manually enable cheats before they work. When playing in co-op, only Atlas can enable `sv_cheats`, but after that both players can use cheats.

* `noclip` - Toggle noclip. You can still die from laserfields, pits, etc.
  * If you are out-of-bounds and noclip is turned off, the screen may turn white. Set `r_portal_use_pvs_optimization 0` to fix.
* `ent_create_portal_companion_cube` - Spawn a cube in the wall at your crosshair position.
	* There are also commands like `ent_create_portal_reflector_cube` for laser cubes, `ent_create_portal_weighted_sphere` for spheres...
* `host_timescale 3` - Change the speed of the game. Numbers greater than 1 speed it up and numbers less than 1 slow it down.
	* `toggle host_timescale 1 3 0.25` - one key to toggle between a bunch of game speeds.
	* If you don't have sv_cheats on, `host_timescale` just changes the pitch of in-game audio, which is pretty funny
* `phys_timescale` - Change the speed of the physics engine.
* `ent_fire !picker use` - "Long range Use". This acts the same as the E key, but doesn't have any distance limitations, so you can pick things up and press pedestal buttons from any distance.
	* *Not* classified as a cheat command according to the game lol
	* It's not safe to replace your "use" key with this because there are some differences and bugs.
* `god` - Toggle god mode.
* `buddha` - Toggle "buddha mode", where you can still take damage but can't die.
* `notarget` - Toggle notarget mode. Turrets can't see you.

I have `noclip` on `U`, `host_timescale` on `I`/`O`/`P` for fast/normal/slow, `ent_create_portal_companion_cube` on `K`, and `ent_fire !picker use` on `C` where it's easy to reach.

### Other commands to know

Mosst of these ones aren't cheats.

* `incrementvar crosshair 0 1 1;incrementvar r_drawviewmodel 0 1 1` - Toggle the crosshair and portal gun.
	* In some mods `r_drawviewmodel` doesn't remove all of the portal gun. Replace it with `incrementvar viewmodel_offset_x 0 2000 2000` to move it way off screen instead.
	* Make sure to enable the HUD again before you exit a map, because `r_drawviewmodel` doesn't carry over between maps but `crosshair` does.
* `;+remote_view` (with a semicolon at the start) - "Sticky" partner view for co-op. Pressing this key opens the viewport of your co-op partner, but you don't need to hold it down to keep it open. It is safe to replace your usual partner view bind with this if you want; you can create a separate "disable remote view" bind with `;-remote_view` as well.
	* The remote view size can be customized with `ss_pipscale`.
* `cl_fov 110` (or whatever number) - Change the game's horizontal field-of-view.
	* Unfortunately you need to press this after every loading screen because the game resets it to 90.
	* Sometimes people bind their W key to `+forward;cl_fov 110` so walking forwards, a thing you do anyway, resets the FOV.
* `viewmodel_offset_x` - Move the portal gun horizontally on the screen.
  * I set this to `2`, it looks nice on widescreen.
* `sv_player_collide_with_laser` - If set to 0, you wn't be burned by lasers anymore.
* `sv_use_bendy_model` - If set to 0, you will use the Chell player model in community maps.
	* Only takes effect on the next map load and doesn't stick between game sessions, so put it in your `autoexec.cfg`.
* `map` - Loads a map.
* `ss_map` - Loads a map in splitscreen.
* `fadein` - Fades the screen back in. Useful if you touched a bottomless pit with noclip/godmode and the screen faded to black.
* `cl_showpos 1` - Show your position and angles in the upper left of the screen.
* `setpos` and `setang` - Set your position and angle exactly. Useful for lining up screenshots.
* `ent_fire !picker <way too many things to list here>` - There's tab-completion on this for the available options. Fires an input to the thing under your crosshair, causing "something" to happen to it. You can change the color, parent it to something, delete it, make it catch on fire...
* `+mouse_menu_playtest` - Unused co-op ping menu with thumbs-up, thumbs-down, ?, and ?!\* reactions. Broken in singleplayer, you will softlock.
* `restart_level` *(does not appear in autocomplete for some reason)* - Restarts the current map. The regular `restart` command is buggy when used on community maps.

# Mods

## SAR

SAR is a plugin that Portal 2 speedrunners use. It stands for "Source Auto Record" which is the *first* thing it did, but it's grown lots of features since then. You can read more about it and find installation instructions on [its website](https://wiki.portal2.sr/SAR).

Most of it is nerdy speedrunner stuff, but it does come with some very significant load-time optimizations. In particular, it makes quicksaves more fun: loading a quicksave created on the same map usually takes less than a second.

After installing, put this in your `autoexec.cfg`:

```codeblock
plugin_load sar
sar_fast_load_preset normal
```

You can write `full` instead of `normal` for even *faster* loads, but this disables *all* loading screen rendering, including things like the name of the community map.

SAR also adds a few more commands that might be useful to non speedrunners. Put these in your autoexec under `plugin_load` as well.

* `sar_force_fov 110` - It's like `cl_fov`, but sticks around after map loads so you don't have to press your fov bind every time.
* `sar_autojump` - Cheat command. Makes you jump continuously while holding the jump key.
* `sar_cvars_unlock` - Enable hidden Portal 2 commands. Most of them are broken/debug/useless, but this one is useful:
  * `ui_transition_effect 0` - Disable the tile-flip animation in menus.

A full list of commands is available [here](https://github.com/p2sr/SourceAutoRecord/blob/master/docs/cvars.md). There are a lot.

## BEEMOD

[BEEMOD](https://github.com/BEEmod/BEE2.4) is a tool to customize the items available in Puzzlemaker. There's custom test elements, but also additional bits of map geometry (wedges, blocks, holes-in-glass...), more features for the vanilla map elements (lifts that only move when you stand on them), more map themes, and more. All available in the in-game editor for you to use, no Hammer knowledge needed.

The Puzzlemaker has some limitations that the mod cannot overcome. You can only have 32 items in your palette at any given moment, and it's not possible for BEE to add new *types* of checkboxes to the editor. But they can take the "Auto-drop first cube" checkbox from cube droppers, graft it onto another item, and make it do something else. It's weird but you get used to it, and all of the weird functions are documented in the BEEMOD application.

For example, the light strip now has a "Cube Type" dropdown. The first three cube types change the color temperature of the emitted light,  and the fifth makes the light invisible (so you can route antlines.) You can also use the invisible logic gate items to route antlines. Antlines have a mind of their own sometimes; there's an art to it.

sadly I'm not a huge fan of the custom map themes. The "Original Clean" style is my favorite.

# Bunnyhopping

Really really quick overview:

* Bind jump to your mousewheel. Scroll whenever you get close to the ground to minimize the amount of ground friction.
* Move by strafing instead of by walking forwards. Only use the W key for an initial burst of speed.

There are far more detailed guides out there and I'm not an expert. It takes a lot of practice to get a feel for the right way to move, how momentum carries, and what the strafing speedcap of 320 units/sec feels like.

Timing jumps with the spacebar is basically impossible. When I play on a laptop I use `sar_autojump`.

# What to play

Unfortunately the Workshop front page is not very good. This is probably because *solving* a map prompts you with the rating screen, so easy maps that everyone can solve get the most thumbs, and interesting/challenging puzzles don't get as many thumbs.

The *best* way to find maps is taking a people-first approach. If you find a map you like, check out the Workshop of the person who made it. Stalk their list of Workshop favorites. If you see any recurring characters in their comments section, see if they also have a Workshop.

Here are some collections to get you started on your journey of finding mappers:

* ["Introduction to the Workshop"](https://steamcommunity.com/sharedfiles/filedetails/?id=470046703) curated by RedSilencer, featuring a bunch of people. Play this first!
* [Employee of the Moment](https://steamcommunity.com/sharedfiles/filedetails/?id=68462137) curated by Valve, featuring Mevious. The only mapper to be featured by Valve.
* [No Elements](https://steamcommunity.com/sharedfiles/filedetails/?id=129519365) by Azorae / Gig / Juggler / Mevious. Really good, deep exploration of the game's momentum and portal mecahnics.
* [Sendificate](https://steamcommunity.com/sharedfiles/filedetails/?id=291653034) by HMW. Contains a crazy custom test element.
* [The Inquisition](https://steamcommunity.com/sharedfiles/filedetails/?id=217988017) by srs bsnss. Contains a yellow fizzler with only *slightly* different rules than the regular one, but totally different gameplay.

Most of the people who made these collections or who are featured in these collections are pretty prolific mappers. There's lots of stuff if you look.

Here's [my list of workshop favorites](https://steamcommunity.com/id/quaternary/myworkshopfiles?appid=620&browsesort=myfavorites&browsefilter=myfavorites&p=1) too, although it's mostly hard shit...

Still, the [top-rated maps of all time](https://steamcommunity.com/workshop/browse/?appid=620&browsesort=toprated&section=readytouseitems) are not a bad place to start either. Here are some more collections:

* [12 Angry Tests](https://steamcommunity.com/workshop/filedetails/?id=68540935) by CaretCaret.
* [Designed for Danger](https://steamcommunity.com/workshop/filedetails/?id=104612418) by Puddy.
* [Dilapidation](https://steamcommunity.com/workshop/filedetails/?id=101728847) by LoneWolf2056. Who later went on to map for Portal Stories: Mel.
* [This is Teamwork](https://steamcommunity.com/workshop/filedetails/?id=292069590) by DrFauli. Two players.
* [Gelocity](https://steamcommunity.com/workshop/filedetails/?id=368330611) by Radix. (This is *definitely* not a puzzle but even the most hardened puzzle nerds will admit it's fun.)

Oh my god there's so many more puzzles I can list, but I don't want this list to be *too* overwhelming. I stuck mostly to collections for this post but there are lots of amazing puzzles that *aren't* part of a series or collection too.

Now go forth!