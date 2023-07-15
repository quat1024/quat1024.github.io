# quatweb-static

Static site generator that generates my website. Ad-hoc, instead of using a tool, purely for NIH reasons (and more practice writing Rust)

Sorry for the goofy rustfmt, I've got Opinions™

Previously it was a dynamic web server (living at [quat1024/quatweb](https://github.com/quat1024/quatweb)) but... now it's not. Deploying to Github Pages is currently done using... manual cut-and-paste, but I'd like to make it automatic eventually (maybe an Action?)

## notes

serving with [miniserve](https://github.com/svenstaro/miniserve) (very nice utility): `miniserve ./out --index index.html`, add `-v` for delicious delicious logspam