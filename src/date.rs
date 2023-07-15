use std::fmt::Display;
use std::ops::Deref;
use std::str::FromStr;

use chrono::FixedOffset;
use chrono::NaiveDate;
use chrono::TimeZone;

#[derive(Clone, PartialEq, Eq, Ord, PartialOrd, Hash, Debug)]
pub struct MyDate {
	inner: NaiveDate,
}

static EPIC_DATE_FORMAT: &str = "%b %d, %Y";

//chrono has "Fixed::RFC822" formatting type but ? you can't plug it into the api ?
static JANKY_RFC822_CAUSE_CHRONO_IS_WEIRD: &str = "%a, %d %b %Y %H:%M:%S %z";

impl FromStr for MyDate {
	type Err = chrono::ParseError;

	fn from_str(s: &str) -> Result<Self, Self::Err> {
		Ok(NaiveDate::parse_from_str(s, EPIC_DATE_FORMAT)?.into())
	}
}

impl From<NaiveDate> for MyDate {
	fn from(n: NaiveDate) -> Self {
		MyDate { inner: n }
	}
}

impl Deref for MyDate {
	type Target = NaiveDate;

	fn deref(&self) -> &Self::Target {
		&self.inner
	}
}

impl Display for MyDate {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		self.inner.format(EPIC_DATE_FORMAT).fmt(f)
	}
}

impl MyDate {
	pub fn to_rfc822(&self) -> String {
		//We need to specify a time and timezone for this date format, I only include a zoneless date in the files
		//just assume midnight eastern time
		let tz = FixedOffset::west_opt(4 * 3600).unwrap();
		tz.from_local_datetime(&self.and_hms(0, 0, 0)).unwrap().format(JANKY_RFC822_CAUSE_CHRONO_IS_WEIRD).to_string()
	}
}
