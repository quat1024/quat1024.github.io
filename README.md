# quatweb-static

Static site generator

Rust code is old, site is generated with the Javascript now. `npm run run`.

Previously it was a dynamic web server (living at [quat1024/quatweb](https://github.com/quat1024/quatweb)) but... now it's not. Deploying to Github Pages is done using the new beta "custom deploy action" feature thingie

## notes

serving with [miniserve](https://github.com/svenstaro/miniserve) (very nice utility): `miniserve ./out --index index.html`, add `-v` for delicious delicious logspam