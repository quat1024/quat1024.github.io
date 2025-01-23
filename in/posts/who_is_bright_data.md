slug=who_is_bright_data
title=Who is Bright Data? Into the "Create: Protection Pixel" junkware
author=quat
created_date=Jan 23, 2025
---
I became aware of the mod ["Create: Protection Pixel"](https://www.curseforge.com/minecraft/mc-mods/protection-pixel) uploaded by [JEDIGD](https://www.curseforge.com/members/jedigd/projects) today through [a /r/feedthememes post](https://old.reddit.com/r/feedthememes/comments/1i7kbsj/), although the mod has been exposed [10 days before](https://old.reddit.com/r/feedthebeast/comments/1i0gyn7/) on /r/feedthebeast. Version `1.1.3` of the mod is notable for displaying a very strange GUI when you first logged into a world.

![GUI saying "Can I use BrightSDK to occupy a very small amount of resources on your device to obtain public data like OS? (NO PERSONAL INFORMATION)](/img/bright_data/screen.webp)

In this post, I'll summarize the code found inside Create: Protection Pixel, discuss Bright Data (the company who appears to be behind the code) and their behaviors in the modded Minecraft community, and I'll conclude with a more detailed analysis of the code inside Protection Pixel for those interested.

## Overview

Create: Protection Pixel is a popular Create addon with over half a million downloads. It is [available on CurseForge](https://www.curseforge.com/minecraft/mc-mods/protection-pixel) and was formerly available on Modrinth; its page has now been taken down. It was made with MCreator.

Ever since version `1.1.2`, the mod `.jar` bundles the [Amplitude Java SDK](https://github.com/amplitude/Amplitude-Java/tree/main/src/main/java/com/amplitude) under `com.amplitude`, and the `org.json:json` library (a dependency of Amplitude SDK) under `org.json`. [Amplitude](https://amplitude.com/) is a software analytics company. This is, obviously, unusual code to find in a Minecraft mod.

The mod also contains four classes placed under `com.brightsdk`: `Device`, `Main`, `SessionTracker`, and `Storage`.

**The code under `com.brightsdk` does not appear to be correctly activated**, but **if it was correctly called**, it would collect the following datapoints:

* your device vendor and platform,
* your operating system name and version,
* the total amount of RAM in your computer,
* **the currently in-use amount of RAM**,
* **the current CPU usage**,

and upload them (together with your IP address) to Amplitude's tracking URL at `https://api2.amplitude.com/2/httpapi` using the API key `7cce83b37fb5848cad6789d71a39b809`. The code would send the data every minute at first, but gradually slow down to every 30 minutes.

### Version differences

I did not examine `1.0.9` and `1.1.1` very thoroughly, but they do not bundle any `com.amplitude` or `com.brightsdk` classes at all. I did not examine any older versions.

Version `1.1.2` started bundling the `com.brightsdk` and `com.amplitude` classes. The mod classloaded `com.brightsdk`, but did not attempt to activate the data collection. It also did not contain any code relating to the GUI consent screen.

Version `1.1.3` included the GUI consent screen. If "yes" was pressed, it attempted to collect data from 1% of users; the mod author could easily set the number from 1 to 100%. *The modder killed the data collection thread immediately after it was started*, however, and because there was a 1-minute delay until the first data collection heartbeat, it's possible no data was uploaded.

Versions `1.1.2` and `1.1.3` of the mod contain different copies of the code under `com.brightsdk`, indicating that Bright SDK was possibly working with the modder and sending them different versions of the code to try.

No version of the mod appeared to contain *functioning* data collection code.

## Who is Bright SDK?

**I need to be clear that the "Bright SDK" product is not in the Minecraft mod.** The code is under `com.brightsdk`, there is a company called Bright SDK who sells a product called "Bright SDK", but I do not believe the code in the mod is the "Bright SDK" product itself.

With that out of the way, who is Bright and what is Bright SDK? If you head to `bright-sdk.com`, they describe themselves as such:

> Bright SDK allows users to get free software and developers to get regular income. It is a good solution to monetize global traffic.

Ok, they advertise themselves as a get-rich-quick / monetization scheme for developers. Their website shows off several shady app-store games using Bright SDK, and their footer links to equally-sketchy offerings aimed at consumers, like "Earn App", "BrightVPN", "BRight" (which "offsets your carbon footprint"), and the discontinued "PiggyBox" (a box you plugged into your home internet connection).

All of these other services claim to make money by helping Bright Data "index public web data", and Bright SDK's ["FAQ for users"](https://bright-sdk.com/users) is no different:

> Bright SDK helps [Bright Data](https://brightdata.com/) to index public web data from large websites – typically e-commerce, travel, consumer brands, etc.

Now, who is Bright Data? Their website proudly offers ["residential proxies"](https://brightdata.com/proxy-types) and a ["web unlocking" service](https://brightdata.com/products/web-unlocker). This is... a somewhat different story! They also throw in CAPTCHA solving services, browser fingerprinting that "imitates real user activity", and faking the HTTP `Referer` header to look like "realistic" traffic, if you needed more convincing they're up to shady shit!

Of course, Bright Data get their residential proxies through people running Bright SDK. People hire Bright Data, they give the customer access to your internet connection because you're running Bright SDK, and the customer does whatever shady shit they needed a residential proxy for. **Bright Data sells a botnet.**

It's a two-headed scam: Bright's user-facing offerings are always careful to mention they only use your Internet for relatively inoffensive purposes like "downloading public data", creating datasets, etc. But the Bright Data side says otherwise: they proudly offer residential proxies, they gloat about how they can be used to circumvent geoblocks and rate-limits, and lie by omission about where their residential proxies come from. Not that residential proxy-seekers care much about ethics.

Here is some more flattering news about Bright Data.  In 2021, they facilitated a DDOS:

* [“Billions of requests, thousands of dollars”: Inside a massive cyberattack on a Philippine human rights group.](https://restofworld.org/2021/philippines-human-rights-cyberattack/) - Researchers say they traced the month-long DDoS attack back to an Israeli company’s network. (Peter Guest, 2021)

> This week, Lündstrom and his team say they were able to trace IP addresses used in the cyberattack to a network operated by Bright Data, an Israel-based company that offers proxy networks and data services to corporate clients. Bright Data has denied any involvement in the attack.

> The company is embroiled in legal action in Israel. After it filed suit against a former employee, he countersued, alleging that Luminati [is widely used for click fraud](https://archive.ph/FYmsj). As part of the suit, it was revealed that the spyware company NSO Group was a Luminati client.

and in 2015, under their former name "Luminati", you may recognize them from their stint owning the Hola VPN, which did the same shit:

* [You joined a botnet if you use this VPN service](https://fortune.com/2015/05/29/hola-luminati-vpn/) (Robert Hackett, 2015)

> It’s dastardly brilliant.  
>   
> Users of the virtual private network Hola got more than they bargained for when they signed up for accounts. When they enrolled in the popular free Israel-based VPN service—presumably to conceal their IP addresses to circumvent Internet restrictions abroad, or to evade eavesdroppers—they actually inadvertently enlisted their devices in a robot army.

Boy, I'm glad *this* company wants to weasel their way into Minecraft!

## Bright and Minecraft

Again, **I have not seen Bright SDK code in the Minecraft mod**. The code under `com.brightsdk` does not appear  to be *the* Bright SDK product. All the Minecraft mod does is upload data about your free CPU and free RAM.

However, Bright SDK pays lip service to being unobtrustive in their user-facing FAQ:

> Bright SDK works in the background *[...]* It won’t disturb you when you use your device.

> Bright SDK carefully safeguards device resources and ensures traffic is only sent by using the device’s available resources, in a manner that will not substantially affect your device’s operations.

> It does not matter how you are using your computer while Bright SDK is running in the background, you will not feel it.

So I think the reason is clear: Bright Data wants to harvest information about free RAM and CPU from Minecraft players, because **they are researching whether modded Minecraft players are good sources of computers for their botnet.**

They've been at this for a while. Jared (the author of CraftTweaker) has received pushy messages from them over email, CurseForge PM, and Discord as early as December 2024:

> I'm surprised it took this long for it to be found in the wild, they were *very* insistant on trying to get me to add it to my mods  
> 
> Not pictured is a discord friend request and DM from them saying the same thing

![](/img/bright_data/jared_messages.png)

and other people corrobate that Bright has been trying to push into the Minecraft space:

> [AterAnimAvis](https://github.com/AterAnimAvis): Someone added BrightSDK (who've been nagging authors recently) to their Mod  

> IHH54: Whos setting up a botnet where  
> Age: BrightSDK, the people that have been bugging loads of modders recently

## Conclusions

**Minecraft mods are, and always have been, arbitrary code.** Minecraft mods can do literally anything to your PC. There is no sandboxing and there never will be. Malware developers knew this, and now adware companies are catching on.

I would say something like "only download mods from trusted people and trusted sources", but this mod had half a million downloads and had every indication of being reliable. (If anything, it's more like when Chrome extension developers sell their browser extension to an adware company.)

**I do not want this to reflect poorly on MCreator.** Can you imagine how much more effective this data collection would be if the modder had a better grasp on Java?

<details><summary>Soapbox</summary>

(I personally believe the author of this mod was just some kid having fun with MCreator who got roped into a get-rich-quick scheme. I hope JEDIGD continues modding and sharing their work with us, but learns that this kind of code is *not* okay to add to Minecraft mods, and Bright SDK's promise of "unlocking a potential revenue stream" is a scam that's too good to be true.)

</details>

## Mitigation?

Look for a file in `~/.brightsdk/data/brd.uuid`. Windows users: that `~` means "home directory", so `C:/Users/yourname/.brightsdk/data/brd.uuid`. If it exists, you probably ran this jar.

But again, I don't think any data was actually sent, so there's no pressing concern.

If you want to play with the affected versions of Create: Protection Pixel anyway, you can install [ctrlaltmilk's Hands Off My Data](https://modrinth.com/mod/hands-off-my-data), which just uses Mixin to neutralize the `com.brightsdk` classes :)

## Analysis

This will be a more detailed look at the code found inside versions `1.1.2` and `1.1.3` of the mod. *You can skip this section if you're not interested in the code.* I used Vineflower `1.10.1` to decompile the mods and manually cleaned up the code for presentation here.

### 1.1.2

In version `1.1.2`, the latest version available on CurseForge, the only reference from the Minecraft mod code into the `com.brightsdk` or `com.amplitude` packages is a singe class `ProtectionPixelModSdk`.

```java
package net.mcreator.protectionpixel.init;

import com.brightsdk.Main;
import net.minecraftforge.fml.common.Mod.EventBusSubscriber;
import net.minecraftforge.fml.common.Mod.EventBusSubscriber.Bus;

@EventBusSubscriber(bus = Bus.MOD)
public class ProtectionPixelModSdk {
  private static Main sdk = new Main();
  
  public static void main(String[] args) {
    String apiKey = System.getProperty("API_KEY", "");
    if (apiKey.isEmpty()) {
      System.err.println("API_KEY not found, exiting");
      System.exit(1);
    }
    sdk.start(apiKey);
  }
}
```

* The `@EventBusSubscriber` causes Forge to load this class.
* An instance of `com.brightsdk.Main` is constructed.
  * An instance of `com.amplitude.Amplitude` is constructed.
  * `com.brightsdk.Device.getOrCreateUUID` is called.
  * This calls `Storage.getString("brd.uuid")`, and if it's null, `Storage.put("brd.uuid", uuid)` is called with a random UUID.
  * This function writes the random UUID to the file `~/.brightsdk/data/brd.uuid`.
    * On the next run, `Storage.getString` will read this file and return this UUID.
  * An instance of `com.brightsdk.SessionTracker` is created.

However, because the `public static void main` function is never called, the Bright or Amplitude code never *actually* sends data. The only way to get this to send data is if you provided your own Amplitude API key and manually invoked `main` with a command like `API_KEY=xxxxxx java net.mcreator.protectionpixel.init.ProtectionPixelModSdk -cp protection_pixel-1.1.2-forge-1.20.1.jar`.

### 1.1.3

This version was formerly on Modrinth (uploaded under `1.1.4`) and was archived by [ctrlaltmilk](https://github.com/ctrlaltmilk/HandsOffMyData/tree/1.20.1). There are several more MCreator procedures related to showing the consent screen, which I have not analyzed closely.

`ProtectionPixelModSdk` has been removed. Now the link between the mod and the `com.brightsdk` package is in the new `SdkProcedure`, which contains the following code:

```java
package net.mcreator.protectionpixel.procedures;

import com.brightsdk.Main;
import javax.annotation.Nullable;
import net.mcreator.protectionpixel.network.ProtectionPixelModVariables;
import net.minecraft.world.entity.Entity;
import net.minecraftforge.event.entity.player.PlayerEvent.PlayerLoggedInEvent;
import net.minecraftforge.eventbus.api.Event;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod.EventBusSubscriber;

@EventBusSubscriber
public class SdkProcedure {
   private static Main sdk = new Main(1);

   @SubscribeEvent
   public static void onPlayerLoggedIn(PlayerLoggedInEvent event) {
      execute(event, event.getEntity());
   }

   public static void execute(Entity entity) {
      execute(null, entity);
   }

   private static void execute(@Nullable Event event, Entity entity) {
    if((entity.getCapability(ProtectionPixelModVariables.PLAYER_VARIABLES_CAPABILITY, null).orElse(new ProtectionPixelModVariables.PlayerVariables())).sdk) {
      String apiKey = "7cce83b37fb5848cad6789d71a39b809";
      sdk.start(apiKey);
    }
    sdk.finalize();
  }
}
```

`com.brightsdk.Main` now takes an integer argument called `rolloutPercentage`. *The code in `com.brightsdk` is different:*

* Creates the `Amplitude` instance, same as before,
* Calls `Device.getOrCreateUUID`, same as before,
* Calls `UUID#hashCode` and prints the result: `userIdHash: _____`
* Divides the result by `100 / rolloutPercentage`, and if it doesn't equal 0, doesn't initialize tracking.
  * Because `rolloutPercentage` is `1`, only a 1% chance to enable tracking.

This code actually does call `start`, so data collection is attempted. However, the `sdk.finalize()` function *immediately cancels data collection* and is always called next. So this function starts data collection and immediately stops it before it sends data. Interesting.

The `sdk` boolean holds the result of the consent screen (`true` if "yes" was clicked). The consent data is stored on the server. This is probably an MCreator-ism (it's hard to work with the client, the consent screen is actually a client-and-server-sided "container" screen, etc). Also, `new PlayerVariables()` creates an instance where `sdk == false`, so if the data fails to load for whatever reason it does not "fail open".

I'm not sure if `PlayerLoggedInEvent` is even fired on the client? Honestly if you play multiplayer, I think this code will make the *server* send the tracking data if you say yes?

Note that `en_us.json` and `zh_cn.json` both contain 205 lines and both contain 9 translation keys relating to the consent screen. The mod is also translated into Russian, but `ru_ru.json` does not contain translation keys relating to the consent screen (it's also missing 5 other translation keys).

## Credits

This post contains information from:

* TheSilkMiner, who sent the original redditpost (by a now-deleted author) to the NeoForge discord
* /u/Geekmarine72 for additional analysis on the original reddit post
* ctrlaltmilk, who analysed and archived a copy of the jar
* Jared, for posting the DMs he received from Bright SDK, and other people for corrobating that Bright has been contacting people
* /u/tetrazine14 for the feedthememes post 💀

If you have any additional information about Bright SDK, or if you are a modder who has been contacted by them, you can email me at `quat@highlysuspect.agency`.