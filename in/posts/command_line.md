slug=command_line
title=How the hell do you use the command line
author=quat
description=And other things you learned ten years ago and forgot how to teach.
created_date=Oct 25, 2022
---
*This was originally gonna be one of those newfangled "twitter" "threads" the kids are posting these days but it got a bit out of hand*

I keep forgetting how unfamiliar the command line is for Normal People. I'm not a command line guru, I only know how to navigate around and use simple commands - but there's already an ocean between this and how *everyone else on the planet* uses a computer.

Like "you use `./blah` to refer to '`blah`, but in the current directory'" Jesse, what the fuck are you talking about? A folder that doesn't go anywhere? That's crazy, next you'll tell me there's somehow a folder name that goes backwards too, hm?

How do you explain the behavior where you accidentally typo an unmatched quote and the terminal gets into a confusing state where it hasn't ran the command and is actually waiting for more user input? You're supposed to figure this out *just from seeing a `>` in the left column?*

Like, given infinite time I can surely explain all these things. But the problem is that I don't want to spend hours explaining the intracacies of how to escape spaces and special characters in arguments to command line options, because if I'm trying to teach someone how to operate a command line it's probably because I want to tell them about a program they can use *with* the command line, and the thing of interest looks less like "how to run `clear` because the terminal got resized and is now stomping over old text" and more like "how to use `yt-dlp`".

Look, I even hyped it up a bit; made it look easy by rattling off the `--extract-audio --audio-format mp3 <youtube video link here>` command that I have stored in an easier-to-access register in my brain than my phone number. I even spelled out `--extract-audio` instead of `-x` to make it appear a little less cryptic.

The first hurdle is that the user entered the URL within brackets, assuming that my `<youtube video link here>` snippet included the angle brackets as part of the command. Thankfully(?) Powershell happily explodes on angle brackets instead of trying to pipe to a file, so it was an easy fix, but it did make me pause. "Of course", I thought, text in angle brackets represents a placeholder, right? "Of course" the angle brackets are part of the placeholder and are not to be copied, because "of course" angle brackets are never part of a command. But this is a convention you have to learn from *somewhere*, and given that the command line is about entering cryptic unfamiliar sequences of characters and words and word-like items and dashes and dots, why *wouldn't* angle brackets fit?

The second problem is that `-x` and `--audio-format` require a separately downloaded `ffmpeg` on your `PATH` (or passed in with an `--ffmpeg-location` argument) to function, meaning that the "simple" command isn't so simple after all. The whole `PATH` business is yet another thing that isn't *unexplainable* - it's how the computer finds programs by name, blah blah - but it's *total fucking moonworld logic* to anyone familiar with a different model of computing.

Take a step back. Most people install programs by googling for an installer and clicking on an `.exe` file, and then there's maybe a desktop icon added to launch the program.

The closest analogy I can think of to "a program that doesn't ship with its own dependencies" is something like a program requiring a Visual C++ Redistributable, which is still ultimately a program you install the familiar way - google for the exe, double click it and follow the directions until the window goes away, and without any more configuration or specifying paths or `PATH`s or computer restarting or terminal restarting or anything else out of the ordinary, the program you actually wanted to run works now. These days most of these programs are Steam games, and Steam even installs vs redistributables for you, so you do not have to do a thing.

I... can't even find ffmpeg "installers" at all. The best I can find are zip files with `/bin` and `/lib` directories and I guess you're expected to manage your path yourself? That's if you can even find the download you want - does GPL versus LGPL matter? (It matters to *me* but to the average person?) Do I want GPL-Shared or just GPL? Is there a 64-bit version I need or does either one work? The .zip or the .7z?

Windows does come with a handy utility buried wayyyy deep in the control panel for modifying environment variables that even has a nice graphical editor for the PATH. Right yeah you gotta restart all open terminals to pick up on the new PATH probably, can you try rerunning the command and seeing if it works now? Or I could have them use yt-dlp's `--ffmpeg-location` switch, which will require figuring out how to pass the path to the program (does it want `/bin` or the root ffmpeg directory? does the install path have spaces and therefore need to be quoted on the command line?), and they'll also need to specify it every time they use the downloader, so don't lose that file path and try not to worry about the giant unwieldy command!

At every point of failure in this process I just think about the process of installing google chrome. You click the exe and it works now. Tada.

Wow! So simple!! Downloading mp3s is easy!!!

At this point I'm not proud to admit I copied the youtube URL out of the user's screenshots, downloaded it locally, saw that the mp3 was less than eight megabytes, apologized profusely, and attached it to a discord message.

# In summary

"Computers."

