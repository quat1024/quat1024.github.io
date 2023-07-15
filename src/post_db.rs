use std::collections::HashMap;
use std::fs;
use std::io::BufRead;
use std::io::BufReader;
use std::io::Lines;
use std::path::Path;
use std::path::PathBuf;

use anyhow::bail;
use anyhow::Context;
use anyhow::Result;

use crate::date::MyDate;
use crate::document::Document;
use crate::document::DocumentSettings;
use crate::markdown;
use crate::pushline::PushLine;
use crate::recursively_iterate_directory;

#[derive(Clone, PartialEq, Eq, Ord, PartialOrd, Hash, Default, Debug)]
pub struct Tag(pub String);

impl AsRef<String> for Tag {
	fn as_ref(&self) -> &String {
		&self.0
	}
}

pub struct Post {
	pub meta: PostMeta,
	pub rendered_html: String,
}

impl Post {
	pub fn from_path(path: &Path) -> Result<Post> {
		let file = fs::File::open(path)?;
		let mut lines_reader = BufReader::new(file).lines();

		let meta = PostMeta::read_meta(path, &mut lines_reader)?;
		let rendered_html = Post::read_body(&mut lines_reader)?;

		Ok(Post { meta, rendered_html })
	}

	pub fn read_body<B: BufRead>(lines_reader: &mut Lines<B>) -> Result<String> {
		//Copy the entire rest of the file, because lmao Rust.
		//Once I've turned my BufReader into a lines reader, I can't recover the original reader,
		//and Lines doesn't implement Read or anything, it literally just has Debug and this line iterator available.
		//(Tokio's reader can be converted back, via into_inner. Is this something the stdlib is missing for a reason?)
		let rest = lines_reader.collect::<Result<Vec<String>, _>>()?.join("\n");
		Ok(markdown::render_to_html(&rest))
	}

	pub fn configure_document_settings(&self, settings: &mut DocumentSettings) {
		settings.set_title(&self.meta.title);
		settings.set_lang(&self.meta.lang);

		if let Some(blurb) = &self.meta.blurb {
			settings.set_blurb(blurb);
		}
	}

	pub fn render_index_entry(&self, out: &mut Document) {
		out.html.push_str("<li");
		if self.meta.draft {
			out.html.push_str(" class=\"fade\"");
		}
		out.html.push('>');

		out.html.push_str(&format!("<span class=\"date\">{}</span> ", &self.meta.created_date));
		out.html.push_str(&format!("<a href=\"/posts/{}\">{}</a>", &self.meta.slug, &self.meta.title));
		if self.meta.draft {
			out.html.push_str(" (DRAFT)");
		}
		if let Some(ref blurb) = self.meta.blurb {
			out.html.push_line("<br>");
			out.html.push_line(blurb);
		}

		out.html.push_line("</li>");
	}

	pub fn render(&self, out: &mut Document, db: &PostDb) {
		out.html.push_line("<div class=\"bigheader\">");
		out.html.push_line(&format!("<h1>{}</h1>", self.meta.title));
		out.html.push_str(&format!("<div class=\"byline\">{}, {}", self.meta.author, self.meta.created_date));
		if let Some(modified_date) = &self.meta.modified_date {
			out.html.push_str(&format!(" (updated {})", modified_date));
		}
		if self.meta.draft {
			out.html.push_str(" &mdash; (draft post)");
		}
		out.html.push_str(" &mdash; ");
		if self.meta.tags.is_empty() {
			out.html.push_str("Untagged");
		} else {
			for tag in &self.meta.tags {
				out.html.push_str(&format!(r#"<a href="/tags/{}">{}</a> "#, tag.0, tag.0))
			}
		}
		out.html.push_line("</div>");
		out.html.push_line("</div>");

		out.begin_article();
		out.html.push_str(&self.rendered_html);

		out.html.push_line(r#"<hr class="cool">"#); //TODO: random hr

		if let Some(older_post) = self.meta.older_post {
			let older_post = db.get_by_id(older_post).unwrap();
			out.html
				.push_line(&format!(r#"<div style="text-align: left"><a href="/posts/{}">&larr; {}</a></div>"#, older_post.meta.slug, older_post.meta.title))
		}

		if let Some(newer_post) = self.meta.newer_post {
			let newer_post = db.get_by_id(newer_post).unwrap();
			out.html
				.push_line(&format!(r#"<div style="text-align: right"><a href="/posts/{}">{} &rarr;</a></div>"#, newer_post.meta.slug, newer_post.meta.title))
		}

		out.end_article();
	}
}

pub struct PostMeta {
	pub input_path: PathBuf,
	/// The URL fragment. Determines where the file will live in the generated output.
	pub slug: String,
	pub author: String,
	pub title: String,
	pub lang: String,
	pub blurb: Option<String>,
	pub created_date: MyDate,
	pub modified_date: Option<MyDate>,
	pub draft: bool,
	pub tags: Vec<Tag>,
	/// The index of the post posted after this one, in the PostDb.
	pub newer_post: Option<usize>,
	/// The index of the post posted before this one, in the PostDb.
	pub older_post: Option<usize>,
}

impl PostMeta {
	pub fn read_meta<B: BufRead>(input_path: &Path, line_reader: &mut Lines<B>) -> Result<PostMeta> {
		let mut kv: HashMap<String, String> = HashMap::new();

		//Parse out each line and toss it into a hashmap.
		for line in line_reader {
			let line = line?;

			//Stop if I see three dashes. This consumes the line, preparing the reader for the post body
			if line == "---" {
				break;
			}

			if line.trim().is_empty() || matches!(line.chars().next(), Some('#')) {
				continue;
			}

			let equal_sign = line.find('=').context("needs equal sign")?;
			kv.insert(line[..equal_sign].to_string(), line[equal_sign + 1..].trim().to_string());
		}

		//Extract keys from the hashmap and throw them in the struct
		//Halfway through writing this im like.... Okay maybe something like Serde would be a good idea
		//Oh well

		//Empty modified_date is fine, but if it's present it has to parse
		let modified_date: Option<MyDate> =
			if let Some(date) = kv.remove("modified_date") { Some(date.parse().context("last-modified date parsing")?) } else { Default::default() };

		//Tags come in a comma-separated list. Let's be careful to not create any Tag("").
		let tags: Vec<Tag> = if let Some(tag_list) = kv.remove("tags") {
			if !tag_list.trim().is_empty() {
				tag_list
					.split(',')
					.filter_map(|x| {
						let trim = x.trim();
						if trim.is_empty() {
							None
						} else {
							Some(Tag(trim.to_owned()))
						}
					})
					.collect()
			} else {
				Default::default()
			}
		} else {
			Default::default()
		};

		Ok(PostMeta {
			input_path: input_path.to_owned(),
			slug: kv.remove("slug").context("no slug")?,
			author: kv.remove("author").context("no author")?,
			title: kv.remove("title").context("no title")?,
			lang: kv.remove("lang").unwrap_or_else(|| "en".into()),
			blurb: kv.remove("description"),
			created_date: kv.remove("created_date").context("no created date")?.parse().context("can't parse created date")?,
			modified_date,
			draft: kv.remove("draft").and_then(|x| x.parse().ok()).unwrap_or(false),
			tags,
			newer_post: None, //to be filled in later
			older_post: None, //to be filled in later
		})
	}

	pub fn primary_tag(&self) -> Option<&Tag> {
		self.tags.first()
	}
}

pub struct PostDb {
	pub all_posts: Vec<Post>,

	//indices into the map
	pub posts_by_slug: HashMap<String, usize>,
	pub posts_by_tag: HashMap<Tag, Vec<usize>>,
	pub posts_by_primary_tag: HashMap<Tag, Vec<usize>>,
}

impl PostDb {
	pub fn from_dir(path: &Path) -> Result<PostDb> {
		eprintln!("Building post database");

		let mut all_posts = Vec::new();

		recursively_iterate_directory(path, &mut |entry| {
			let s = format!("parsing post at {}", entry.path().display());
			eprintln!("{s}");
			all_posts.push(Post::from_path(&entry.path()).context(s)?);
			Ok(())
		})?;

		all_posts.sort_by(|a, b| b.meta.created_date.cmp(&a.meta.created_date));

		//Populate next and previous post fields
		let mut i = all_posts.iter_mut().enumerate().peekable();
		while let Some((a_idx, a)) = i.next() {
			if let Some((b_idx, b)) = i.peek_mut() {
				a.meta.older_post = Some(*b_idx);
				b.meta.newer_post = Some(a_idx);
			}
		}

		let mut posts_by_slug = HashMap::new();
		let mut posts_by_tag: HashMap<_, Vec<_>> = HashMap::new();
		let mut posts_by_primary_tag: HashMap<_, Vec<_>> = HashMap::new();

		for (idx, post) in all_posts.iter().enumerate() {
			if posts_by_slug.insert(post.meta.slug.clone(), idx).is_some() {
				bail!("Duplicate post slug: {}", post.meta.slug);
			}

			for tag in post.meta.tags.iter() {
				(*posts_by_tag.entry(tag.clone()).or_default()).push(idx);
			}

			if let Some(tag) = post.meta.primary_tag() {
				(*posts_by_primary_tag.entry(tag.clone()).or_default()).push(idx);
			}
		}

		Ok(PostDb { all_posts, posts_by_slug, posts_by_tag, posts_by_primary_tag })
	}

	pub fn get_by_id(&self, id: usize) -> Option<&Post> {
		self.all_posts.get(id)
	}

	//Super lameo cloning operation
	pub fn get_by_tag(&self, tag: &Tag) -> Vec<&Post> {
		if let Some(post_ids) = self.posts_by_tag.get(tag) {
			post_ids.iter().map(|id| self.get_by_id(*id).unwrap()).collect()
		} else {
			Vec::new()
		}
	}

	pub fn get_by_primary_tag(&self, tag: &Tag) -> Vec<&Post> {
		if let Some(post_ids) = self.posts_by_primary_tag.get(tag) {
			post_ids.iter().map(|id| self.get_by_id(*id).unwrap()).collect()
		} else {
			Vec::new()
		}
	}

	pub fn tags(&self) -> impl Iterator<Item = &Tag> {
		self.posts_by_tag.keys()
	}

	pub fn interesting_primary_tags(&self, thres: usize) -> Vec<&Tag> {
		let mut result: Vec<_> = self.posts_by_primary_tag.keys().filter(|tag| self.primary_tag_interestingness(tag) >= thres).collect();

		//Sort by post count (descending), breaking ties with alphabetical order
		result.sort();
		result.sort_by_cached_key(|s| usize::MAX - self.primary_tag_interestingness(s));

		result
	}

	pub fn primary_tag_interestingness(&self, tag: &Tag) -> usize {
		self.posts_by_primary_tag.get(tag).map(Vec::len).unwrap_or(0)
	}

	pub fn count_posts_with_tag(&self, tag: &Tag) -> usize {
		self.all_posts.iter().filter(|post| post.meta.tags.contains(tag)).count()
	}

	//todo a lot of this stuff is hard coded
	//Also i shouldnt really be using Document abstraction here cause thats for html and this is rss
	//oh well im silly goober
	pub fn render_to_feed(&self) -> Document {
		let mut document = DocumentSettings::new().new_document();

		document.html.push_line(r#"<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">"#);
		document.html.push_line(r#"<channel><title>Highly Suspect Agency</title><link>https://highlysuspect.agency</link><description>🤫</description>"#);
		document.html.push_line(r#"<atom:link href="https://highlysuspect.agency/feed.xml" rel="self" type="application/rss+xml" />"#);

		for post in &self.all_posts {
			document.html.push_line("<item>");
			document.html.push_line(&format!(r#"<title>{}</title>"#, post.meta.title));
			document.html.push_line(&format!(r#"<link>https://highlysuspect.agency/posts/{}</link>"#, post.meta.slug));
			document.html.push_line(&format!(r#"<guid>https://highlysuspect.agency/posts/{}</guid>"#, post.meta.slug));
			document.html.push_line(&format!(r#"<pubDate>{}</pubDate>"#, post.meta.created_date.to_rfc822()));
			if let Some(blurb) = &post.meta.blurb {
				document.html.push_line(&format!(r#"<description>{}</description>"#, blurb));
			}

			document.html.push_line("<content:encoded><![CDATA[");
			document.html.push_str(&post.rendered_html);
			//TODO: escape CDATA
			document.html.push_line("]]></content:encoded>");

			document.html.push_line("</item>");
		}

		document.html.push_line(r#"</channel></rss>"#);
		document
	}
}
