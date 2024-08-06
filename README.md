# quatweb-static

This is like 50% my website and 50% an excuse to play around with technology I find interesting.

Typescript/Deno conversion in progress. Previously written in pure JS/node, previously previously written in Rust, previously previously previously a [dynamic web server](https://github.com/quat1024/quatweb) for some reason.

TODO: fix the RSS feed (and then delete the Rust code), find the old 404 page, write a real templating engine so I don't need to hardcode the landing and discord pages...

## notes

locally serving with [miniserve](https://github.com/svenstaro/miniserve): `miniserve ./out --index index.html`, add `-v` for logspam (actually use `deno task serve` for that)