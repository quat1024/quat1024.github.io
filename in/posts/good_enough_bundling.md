slug=good_enough_bundling
title="Good enough" Javascript bundling
description=(it's esbuild)
author=quat
created_date=Jan 24, 2025
---
Sadly I haven't touched [blanksky](https://github.com/quat1024/blanksky) in a while, but I wanted to write a bit more about its development setup, since I'm finding it's not a terrible way to write browser-destined Typescript.

## Overview

I write Typescript in the `./src` directory, bundle it into a single Javascript file under `./dist/script.mjs` using `esbuild`, and then point my browser at an `index.html` file which includes that script by name.

This is a toy project so I haven't implemented any kind of "build for distribution" mode yet. It wouldn't be hard: the to-be-distributed product consists of one HTML file, one stylesheet, and one JS file, which just need to be copied to the appropriate locations on a web server.

## Role of npm

Purely for provisioning packages. I didn't fill out any package metadata fields, and I don't use npm scripts because they're slow.

This is the entire `package.json`:

```json
{
  "devDependencies": {
    "esbuild": "0.24.0"
  },
  "dependencies": {
    "@atproto/api": "^0.13.14",
    "facon": "^2.0.3"
  }
}
```

That's `esbuild` at dev time, plus some libraries I use at runtime. If you depend on libraries by putting them in your `package.json`, `esbuild` knows how to find them when bundling your project, without any extra configuration.

Managing `esbuild` through `package.json` is a great way to avoid dependency-hell problems that occur when you install it globally.

I personally gitignore `node_modules`.

## Invoking esbuild

From the command line, like this:

```sh
esbuild ./src/main.ts --bundle --format=esm --tree-shaking=true --target=es2023 --outfile=./dist/script.mjs
```

`esbuild` has a Javascript API for *really* in-depth configuration, but I have not needed to use it.

* `--bundle` - tells esbuild to bundle everything that `./src/main.ts` depends on
* `--tree-shaking=true` - remove all symbols I don't use
* `--target=es2023 --format=esm` - this is because I really wanted esbuild to create an ES2023 module.

You might want to pass `--sourcemaps` (for sourcemaps) or `--watch` (to automatically rebuild on changes); I manually rerun my script when I want to rebuild.

Then I import `/dist/script.mjs` from my html.

## Task running

npm has a `scripts` feature which allows you to put small shell scripts into the `package.json` file. However npm is ridiculously slow at finding and executing these scripts for some reason. I experimented with using a Makefile to hold my tiny scripts, but wasn't happy because it doesn't support argument-passing, and it's still pretty slow. I didn't want to install a dedicated task-runner program such as `just`, either.

So currently I'm using a `task.sh` shell script.

```sh
#!/usr/bin/env sh
set -eu

PATH=./node_modules/.bin:$PATH

build () {
  esbuild ./src/main.ts --bundle --format=esm --tree-shaking=true --target=es2023 --outfile=./dist/script.mjs
}
serve () {
  miniserve -v --index index.html .
}
open () {
  start "http://[::1]:8080"
}

help () {
  echo "Available functions:"
  compgen -A function
}

echo "--- ${1:-build} ---"
eval "${@:-build}"
```

This is based off [a trick Adrian Cooney described](https://github.com/adriancooney/Taskfile) as a "Taskfile".

The highlights:

* `PATH=./node_modules/.bin:$PATH` prepends "the folder NPM drops its programs inside" to the shell PATH. This means I can invoke `esbuild` instead of `./node_modules/.bin/esbuild`.
* Then I have one function per "task": `build` invokes `esbuild`, `serve` runs [`miniserve`](https://github.com/svenstaro/miniserve) which starts a web server, and `open` opens localhost in my default browser.
  * The web server isn't an important piece; I don't need it in CI, and it's something I'm cool with installing separately instead of managing through npm.
* `help` runs `compgen -A function`. This is a shell builtin intended to be used for tab-completion generation. Passing `-A function` make it print the names of all functions in the script, one-per-line; good for printing a list of all "tasks".

The magic part is `eval "${@:-build}"`, but `eval "$@"` also works. If you invoke the script like `./task.sh serve foo`, `$@` evaluates to `serve foo`, and `eval`ing that will call the shell function `serve` with an argument of `foo`. The `${@:-build}` syntax simply substitutes `build` if you didn't invoke the script with any arguments. (This isn't "safe"; `./task.sh ls` will run `ls` even though it's not a so-called "task" in the file, but that's okay with me.)

If your eyes glazed over that last paragraph: mine did too. `sh` sucks. But it works and it's preinstalled.  Whatever.

I like to run `alias t=./task.sh`, then I can build by running `t` in the terminal.

## Typescript junk

There are three moving pieces in the Typescript world:

* `tsc`, the Microsoft Typescript compiler, which type-checks your code and transpiles it to Javascript. Famous for being slow.
* `esbuild`, which can "compile" Typescript to Javascript by simply deleting all the type information. Of course it's faster: it doesn't do any typechecking.
* VSCode, an editor which seems to understand Typescript well enough, and provides all the error messages I need.

I don't use `tsc`. Instead I use VSCode for realtime typechecking and `esbuild` for transpiling. The main caveat is that `esbuild` doesn't know if the program fails typechecking, and will happily transpile it anyway; and VSCode is *pretty* good about showing type errors but it's not 100% reliable, especially if an error occurs in a file you haven't opened yet. Just something to watch out for.

Here is my `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2023",
    "lib": ["ES2023", "DOM"],
    "moduleResolution": "Bundler",
    "isolatedModules": true
  }
}
```

* `strict` is set purely because I like typescript strict mode. It only affects errors that appear thru VSCode.
* `target` is *supposed* to control what `tsc` compiles your code into. But with `esbuild`, it only controls some corner-cases of how it turns Typescript into javascript I think? (I just made it match the `--target` I passed to `esbuild`.)
* `lib` causes VSCode to bring in type hints for new ES2023 features and DOM APIs. `esbuild` doesn't care.
* `moduleResolution` tells VSCode to resolve `import`s the same way bundlers like `esbuild` do.
* `isolatedModules` forbids Typescript language features that don't work when using a naive transpiler. You can see the [isolatedModules documentation](https://www.typescriptlang.org/tsconfig/#isolatedModules) for a (short) list.

## Possible simplifications

Use Javascript instead of Typescript. Then you don't need a `tsconfig.json`. (Writing large JS programs without a type system drives me crazy, though.)

If you write Javascript and use ES6 modules, then you [don't even need a bundler](https://jvns.ca/blog/2024/11/18/how-to-import-a-javascript-library/) to import a respectable percentage of third party code. There are also CDNs like `unpkg`, if you can stomach the idea of tying your website to a third party server.

Instead of the "taskfile", you could use NPM scripts (if you can put up with how long it takes NPM to find your script), or use separate scripts `./build.sh`, `./serve.sh`, `./open.sh` (if you can deal with the clutter).

## Conclusions

* Optimizing the edit/compile/run cycle is important.
* One-off shell scripts are nothing to be afraid of. Even on Windows, everyone has "git bash" installed, which is compatible enough with basic scripts.
* You don't need a lot of moving parts to write browser Javascript.