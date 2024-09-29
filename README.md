# quatweb-static

This is like 50% my website and 50% an excuse to play around with technology I find interesting.

Typescript/Deno conversion in progress. Previously written in pure JS/node, previously previously written in Rust, previously previously previously a [dynamic web server](https://github.com/quat1024/quatweb) for some reason.

TODO: find the old 404 page, write a real templating engine so I don't need to hardcode the landing and discord pages...

## photo gallery

Run `deno task photo` to add a photo. Pass it the photo to add on the command line.

Shells out to some programs:

* `cwebp` (WEBP conversion). Provided by `libwebp` in scoop
* `exiftool` (image width/height and EXIF metadata) Provided by `exiftool` in scoop

## notes

locally serving with [miniserve](https://github.com/svenstaro/miniserve): `miniserve ./out --index index.html`, add `-v` for logspam (actually use `deno task serve` for that) (actually just do `make serve`)