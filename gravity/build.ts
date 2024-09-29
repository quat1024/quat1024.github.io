import * as process from "node:process";
import * as path from "node:path";
import * as esbuild from "esbuild";
import { denoPlugins as esbuildDenoLoader } from "esbuild-deno-loader";

const cwd = process.cwd();
console.log("cwd:", cwd);
if(!cwd.includes("gravity")) {
  console.error("cwd not set to the gravity directory!");
  process.exit(1);
}

const denoJson = path.join(cwd, "deno.json");

const result2 = await esbuild.build({
  plugins: [...esbuildDenoLoader({
    configPath: denoJson,
  })],
  entryPoints: ["gravity.ts"],
  bundle: true,
  minify: true,
  treeShaking: true,
  legalComments: "inline",
  format: "esm",
  outfile: "./out/gravity.mjs"
});

console.log("result:", result2);
await esbuild.stop();