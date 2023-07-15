pub trait PushLine {
	fn push_line(&mut self, line: &str);
}

impl PushLine for String {
	fn push_line(&mut self, line: &str) {
		self.reserve(line.len() + 1);
		self.push_str(line);
		self.push('\n');
	}
}
