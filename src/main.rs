use std::env;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

use anyhow::Context;
use anyhow::Result;

use crate::document::DocumentSettings;
use crate::post_db::PostDb;
use crate::pushline::PushLine;

mod date;
mod document;
mod markdown;
mod post_db;
mod pushline;

fn main() -> Result<()> {
	let pwd = env::current_dir()?;

	let in_dir = pwd.join("in");
	let out_dir = pwd.join("out");

	eprintln!("In: {}\nOut: {}", in_dir.display(), out_dir.display());

	//Delete output dir...
	//actually don't, i'm too afraid of deleting something important lol

	//Copy static resources
	copy_static(&in_dir.join("static"), &out_dir).context("copying static resources")?;

	//Build post database
	let post_db = PostDb::from_dir(&in_dir.join("posts")).context("building post database")?;

	//write out the pages
	write_landing(&post_db, &out_dir)?;
	write_discord(&out_dir)?;
	write_feed(&post_db, &out_dir)?;

	let posts_dir = out_dir.join("posts");
	write_post_index(&post_db, &posts_dir)?;
	write_posts(&post_db, &posts_dir)?;

	let tags_dir = out_dir.join("tags");
	write_tag_index(&post_db, &tags_dir)?;
	write_tags(&post_db, &tags_dir)?;

	Ok(())
}

/// Calls a function on every file in a directory, recursively.
/// Yoinked from the Rust documentation for std::fs::read_dir.
pub fn recursively_iterate_directory(dir: &Path, callback: &mut dyn FnMut(&fs::DirEntry) -> Result<()>) -> Result<()> {
	if dir.is_dir() {
		for entry in fs::read_dir(dir)? {
			let entry = entry?;
			if entry.path().is_dir() {
				recursively_iterate_directory(&entry.path(), callback)?;
			} else {
				callback(&entry)?;
			}
		}
	}

	Ok(())
}

/// fs::write but creates parent directories first.
/// Signature copypasted from fs::write lol.
pub fn write<P: AsRef<Path>, C: AsRef<[u8]>>(path: P, contents: C) -> std::io::Result<()> {
	fs::create_dir_all(path.as_ref().parent().expect("parent"))?;
	fs::write(&path, &contents)
}

/// fs::copy but creates parent directories first.
pub fn copy<P: AsRef<Path>, Q: AsRef<Path>>(from: P, to: Q) -> std::io::Result<u64> {
	fs::create_dir_all(to.as_ref().parent().expect("parent"))?;
	fs::copy(&from, &to)
}

/// Copy files from the in_dir to the out_dir.
fn copy_static(in_dir: &Path, out_dir: &Path) -> Result<()> {
	eprintln!("Copying static resources");

	if !in_dir.exists() {
		eprintln!("Not copying static files - {} does not exist.", in_dir.display());
		return Ok(());
	}

	let prefix_len = in_dir.components().count();

	recursively_iterate_directory(in_dir, &mut |entry| {
		//Chop off the .../whatever/in/static/ component of the path
		let dest_suffix = &entry.path().components().skip(prefix_len).collect::<PathBuf>();

		//Glue it onto the end of the .../whatever/out/static/ path
		let dest = &out_dir.join(dest_suffix);

		//Perform the copy
		let s = format!("Copying {} to {}", entry.path().display(), dest.display());
		eprintln!("{s}");
		copy(entry.path(), dest).context(s)?;

		Ok(())
	})
	.with_context(|| format!("iterating static resource input directory at {}", in_dir.display()))?;

	Ok(())
}

fn write_landing(post_db: &PostDb, out_dir: &Path) -> Result<()> {
	eprintln!("Writing landing page");

	let mut document = DocumentSettings::new().new_document();
	document.begin_typical_article_document();

	document.html.push_line(r#"<section>
<h1>Hey</h1>
<p>I'm quaternary, but you can call me quat. I write <a href="https://www.curseforge.com/members/quat1024/projects" target="_blank">Minecraft mods</a>.</p>
<p>I've also been working on maintaining <a href="https://github.com/CrackedPolishedBlackstoneBricksMC/voldeloom" target="_blank">Gradle tooling for decade-old
Minecraft Forge versions</a>, experimenting with <a href="https://github.com/quat1024/AutoThirdPerson" target="_blank">cursed Gradle megaprojects</a> to ease
the updating and backporting workload, and learning <a href="https://github.com/quat1024/hatchery" target="_blank">a bit of Rust</a>. Previously I made a bunch of
<a href="https://steamcommunity.com/id/quaternary/myworkshopfiles/" target="_blank">Portal 2 test chambers</a>.</p>
<p>Rrrrarh! 🐲</p>
<h2>Let's talk</h2>
<p>To ask a question about my Minecraft mods, please leave a comment, join my <a href="/discord">public Discord</a>, or send a
<a href="https://www.curseforge.com/members/quat1024/projects">CurseForge message.</a></p>
<p>For other inquiries, email me: <a href="mailto:quat@highlysuspect.agency">quat@highlysuspect.agency</a>
</section>
<section>
<h2>Writing</h2>
<p>These are the three most recent posts. You can also <a href="/posts/">browse all the posts in chronological order.</a></p><ul>"#);
	for post in post_db.all_posts.iter().filter(|post| !post.meta.draft).take(3) {
		post.render_index_entry(&mut document);
	}

	document.html.push_line(r#"</ul><p>Here are the posts organized by category. You can also <a href="/tags/">browse all the topics.</a></p>"#);
	for tag in post_db.interesting_primary_tags(1) {
		document.html.push_line(&format!("<h3>Writing about {}</h3>", tag.0));
		document.html.push_line("<ul>");
		for post in post_db.get_by_primary_tag(tag) {
			post.render_index_entry(&mut document);
		}
		document.html.push_line("</ul>")
	}
	document.html.push_line(
		r#"</section>
<section>
<h2>Links</h2>
<ul class="links">
<li><a href="https://www.curseforge.com/members/quat1024/projects" target="_blank">CurseForge</a> quat1024</li>
<li><a href="https://github.com/quat1024" target="_blank">GitHub</a> quat1024</li>
<li><a href="https://twitter.com/quat1024" target="_blank">Twitter</a> @quat1024</li>
<li><a href="https://steamcommunity.com/id/quaternary/myworkshopfiles/" target="_blank">Steam Workshop</a></li>
</ul>
</section>"#,
	);
	document.end_typical_article_document();

	write(out_dir.join("index.html"), &document.html)?;
	Ok(())
}

fn write_discord(out_dir: &Path) -> Result<()> {
	eprintln!("Writing discord page(s)");

	let mut settings = DocumentSettings::new();
	settings.set_title("Discord");

	let mut document = settings.new_document();
	document.begin_typical_article_document();
	document.html.push_str(
		r#"<section>
<h1>Hello!</h1>
<p>This is a landing page I made so I don't need to update fifteen thousand links when I need to change the invite link.</p>
<p>If you'd like to go to my Discord server, <a href="https://discord.gg/WUXsbGH">step right this way</a>. To go to my Matrix room,
<a href="https://matrix.to/#/#quat_mods:matrix.org">step this way instead</a>.</p>
</section>
<section>
<h2>Other contacts</h2>
<p>If you need help or support, but don't want to use Discord or Matrix:</p>
<ul>
<li>Leave a comment on the mod's CurseForge page.</li>
<li>Open an issue on the mod's issue tracker. It's okay if you don't have "an issue" and just want to ask a question, I don't mind.
The issue tracker is usually on GitHub and linked on the mod's CurseForge or Modrinth page. All my mods are open-source on Github so if
there's no link, let me know.</li>
<li>Email me: <a href="mailto:quat@highlysuspect.agency">quat@highlysuspect.agency</a>
<li>Ping me on Twitter, <a href="https://twitter.com/quat1024" target="_blank">@quat1024</a>. Just @ me, i don't check DMs often.</li>
</ul>
<p>Unfortunately I cannot provide support for my old Forge 1.12 mods.</p>
</section>
<section>
<h2>Things you don't need to tell me about</h2>
<p>I am well aware that Minecraft 1.20 is out. Please be patient.
</section>
"#,
	);
	document.end_typical_article_document();

	//Write to (out)/discord/index.html instead of (out)/discord.html.
	//If a link ends in a trailing slash, like "https://highlysuspect.agency/discord/",
	//Github Pages's router won't direct it to (out)/discord.html. That only works with a subfolder/index.html pair.
	write(out_dir.join("discord").join("index.html"), &document.html)?;
	//But also write it to the old discord.html location so old links work.
	//If I can't change the router I can at least do this.
	write(out_dir.join("discord.html"), &document.html)?;
	Ok(())
}

fn write_post_index(post_db: &PostDb, posts_dir: &Path) -> Result<()> {
	eprintln!("Writing post index page");

	let mut settings = DocumentSettings::new();
	settings.set_title("Post Index");

	let mut document = settings.new_document();
	document.begin_typical_article_document();
	document.html.push_line("<h1>Post Index</h1>");

	document.html.push_str("<p>");
	let count = post_db.all_posts.len();
	if count == 1 {
		document.html.push_str("The post!");
	} else {
		document.html.push_str(&format!("All {} posts!", count));
	}
	document.html.push_line(r#" See also: the <a href="/tags">tag index</a>.</p>"#);
	document.html.push_line("<ul>");

	for post in &post_db.all_posts {
		post.render_index_entry(&mut document);
	}

	document.html.push_line("</ul>");

	document.end_typical_article_document();

	write(posts_dir.join("index.html"), &document.html)?;

	Ok(())
}

fn write_posts(post_db: &PostDb, posts_dir: &Path) -> Result<()> {
	eprintln!("Writing post pages");

	for post in post_db.all_posts.iter() {
		eprintln!("Writing post {}", &post.meta.title);

		let mut settings = DocumentSettings::new();
		post.configure_document_settings(&mut settings);

		let mut document = settings.new_document();

		document.begin_html();
		document.head();
		document.begin_body();
		document.page_header();

		post.render(&mut document, post_db);

		document.end_body();
		document.end_html();

		write(posts_dir.join(&post.meta.slug).join("index.html"), &document.html)?;
	}

	Ok(())
}

fn write_tag_index(post_db: &PostDb, tags_dir: &Path) -> Result<()> {
	eprintln!("Writing tag index page");

	let mut settings = DocumentSettings::new();
	settings.set_title("Tag Index");
	let mut document = settings.new_document();
	document.begin_typical_article_document();
	document.html.push_line("<h1>Tag Index</h1>");

	let mut tags = post_db.tags().collect::<Vec<_>>(); //get a list of all tags
	tags.sort(); //sort in alphabetical order
	tags.sort_by_key(|tag| usize::MAX - post_db.count_posts_with_tag(tag)); //then sort by post count (descending). since sort_by_key is a stable sort, ties are broken alphabetically

	let count = tags.len();
	document.html.push_str("<p>");
	if count == 1 {
		document.html.push_str("The tag!");
	} else {
		document.html.push_str(&format!("All {} tags!", count));
	}
	document.html.push_line(r#" See also: the <a href="/posts">post index</a>.</p>"#);

	document.html.push_line("<ul>");
	for tag in tags {
		let count = post_db.count_posts_with_tag(tag);
		let tag = &tag.0;
		document.html.push_line(&format!(r#"<li><a href="{tag}">{tag}</a> - {count} {}</li>"#, if count == 1 { "post" } else { "posts" }));
	}
	document.html.push_line("</ul>");
	document.end_typical_article_document();
	write(tags_dir.join("index.html"), &document.html)?;
	Ok(())
}

fn write_tags(post_db: &PostDb, tags_dir: &Path) -> Result<()> {
	eprintln!("Writing tag pages");

	for tag in post_db.tags() {
		let posts = &post_db.get_by_tag(tag);

		let mut settings = DocumentSettings::new();
		settings.set_title(&format!("Tag '{}'", tag.0));

		let mut document = settings.new_document();
		document.begin_typical_article_document();

		document.html.push_line(&format!("<h1>Posts under '{}'</h1>", tag.0));
		document.html.push_str("<p>");
		document.html.push_str(&if posts.len() == 1 { "The post".into() } else { format!("All {} posts", posts.len()) });
		document.html.push_str(&format!(" <a href=\"/tags\">tagged</a> with '{}':", tag.0));
		document.html.push_line("</p>");

		document.html.push_line("<ul>");
		for post in posts {
			post.render_index_entry(&mut document);
		}
		document.html.push_line("</ul>");

		document.end_typical_article_document();
		write(tags_dir.join(tag.as_ref()).join("index.html"), &document.html)?;
	}

	Ok(())
}

fn write_feed(post_db: &PostDb, out_dir: &Path) -> Result<()> {
	write(out_dir.join("feed.xml"), post_db.render_to_feed().html)?;
	Ok(())
}
