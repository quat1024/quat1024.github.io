# quatweb-static

My former blog. I'm in the process of decomissioning it in favor of [garden](https://github.com/quat1024/garden).

## photo gallery

Run `deno task photo` to add a photo. Pass it the photo to add on the command line.

Shells out to some programs:

* `cwebp` (WEBP conversion). Provided by `libwebp` in scoop
* `exiftool` (image width/height and EXIF metadata) Provided by `exiftool` in scoop

## notes

locally serving with [miniserve](https://github.com/svenstaro/miniserve): `miniserve ./out --index index.html`, add `-v` for logspam (actually use `deno task serve` for that) (actually just do `make serve`)