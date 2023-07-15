use crate::pushline::PushLine;

pub struct DocumentSettings {
	title: String,
	blurb: Option<String>,
	lang: String,
}

impl DocumentSettings {
	pub fn new() -> DocumentSettings {
		DocumentSettings { title: String::default(), blurb: Option::default(), lang: "en".into() }
	}

	pub fn set_title(&mut self, title: &str) {
		self.title = title.to_owned();
	}

	pub fn set_lang(&mut self, lang: &str) {
		self.lang = lang.to_owned();
	}

	pub fn set_blurb(&mut self, blurb: &str) {
		self.blurb = Some(blurb.to_owned());
	}

	pub fn new_document(self) -> Document {
		Document { settings: self, html: String::new() }
	}
}

pub struct Document {
	pub settings: DocumentSettings,
	pub html: String,
}

impl Document {
	pub fn begin_typical_article_document(&mut self) {
		self.begin_html();
		self.head();
		self.begin_body();
		self.page_header();
		self.begin_article();
	}

	pub fn end_typical_article_document(&mut self) {
		self.end_article();
		self.end_body();
		self.end_html();
	}

	pub fn begin_html(&mut self) {
		self.html.push_line("<!DOCTYPE html>");
		self.html.push_line(&format!(r#"<html lang="{}">"#, self.settings.lang));
	}

	pub fn head(&mut self) {
		self.html.push_line("<head>");

		if self.settings.title.is_empty() {
			self.html.push_line("<title>Highly Suspect Agency</title>");
			self.html.push_line(r#"<meta property="og:title" content="Highly Suspect Agency">"#);
		} else {
			self.html.push_line(&format!("<title>{} - Highly Suspect Agency</title>", self.settings.title));
			self.html.push_line(&format!(r#"<meta property="og:title" content="{}">"#, self.settings.title));
		}

		if let Some(blurb) = &self.settings.blurb {
			self.html.push_line(&format!(r#"<meta property="og:description" content="{}">"#, blurb));
		}
		self.html.push_line(r#"<meta property="og:type" content="website">"#);
		self.html.push_line(r#"<meta property="og:url" content="https://highlysuspect.agency">"#);
		self.html.push_line(r#"<meta property="og:image" content="https://highlysuspect.agency/favicon128.png">"#);
		self.html.push_line(r##"<meta property="theme-color" content="#950000">"##);

		self.html.push_line(r#"<link rel="stylesheet" type="text/css" href="/stylin.css">"#);
		self.html.push_line(r#"<link rel="stylesheet" type="text/css" href="/rotator.css">"#);
		self.html.push_line(r#"<link rel="alternate" type="application/rss+xml" href="/feed.xml">"#);
		self.html.push_line(r#"<link rel="icon" type="image/x-icon" href="/favicon.ico">"#);
		self.html.push_line(r#"<meta name="viewport" content="width=device-width, initial-scale=1">"#);
		self.html.push_line("</head>");
	}

	pub fn begin_body(&mut self) {
		self.html.push_line(r#"<body>"#);
	}

	pub fn page_header(&mut self) {
		self.html.push_line(r#"<header>"#);
		self.html.push_line(r#"<a href="/" class="sign" aria-hidden="true">"#);
		self.html.push_line(
			r#"<div class="circle s1"></div><div class="cover s2"></div><div class="circle s3"></div><div class="cover s4"></div><div class="iris"></div>"#,
		);
		self.html.push_line(r#"</a>"#);
		self.html.push_line(r#"<h1><a href="/">Highly Suspect Agency</a></h1>"#);
		self.html.push_line(r#"<div style="flex-grow: 1"></div>"#);
		self.html.push_line(r#"<nav><a href="/feed.xml">RSS</a> <a href="/posts">Blog</a></nav>"#);
		self.html.push_line(r#"</header>"#);
	}

	pub fn begin_article(&mut self) {
		self.html.push_line(r#"<article>"#);
	}

	pub fn end_article(&mut self) {
		//TODO: move the footer somewhere else (outside the <article>, definitely)
		self.html.push_line(r#"<div style="text-align: right; font-size:60%">Powered by <a href="https://github.com/quat1024/quat1024.github.io/">Rust</a>™</div>"#);
		self.html.push_line(r#"</article>"#);
	}

	pub fn end_body(&mut self) {
		self.html.push_line(r#"</body>"#);
	}

	pub fn end_html(&mut self) {
		self.html.push_line("</html>");
	}
}
