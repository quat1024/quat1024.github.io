//I think a fun exersize would be writing my own Markdown parser
//Not spec-compliant, jesus. Markdown is awful to parse.
//But for like, simple bolds and italics, it would be nice to have something I made myself.

pub fn render_to_html(markdown: &str) -> String {
	let parser = pulldown_cmark::Parser::new_ext(markdown, pulldown_cmark::Options::all() - pulldown_cmark::Options::ENABLE_SMART_PUNCTUATION);
	let mut html = String::new();
	pulldown_cmark::html::push_html(&mut html, parser);
	html
}
