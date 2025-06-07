import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import * as child_process from "node:child_process";
import { z } from "zod";
import { Photo, PhotoDb, writePhotoDb, ZPhotoDb } from "./photos.tsx";
import { parseExifDate } from "./date.ts";
import pLimit from "p-limit";
import { compareDatesAsc } from "./date.ts";

//EDIT THIS when bulk uploading!!!
const FORCED_PHOTO_PROPS: object = {
  category: "fwa-25",
	"camera": "Google Pixel 9 Pro",
	"software": "darktable 5.0.1",
};

type Flag = string | number;

//modifies in-place
function str(arr: Flag[]): string[] {
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] == "number") {
      arr[i] = "" + Math.round(arr[i] as number);
    }
  }
  return arr as string[];
}

//Adapted from https://kisaragi-hiu.com/nodejs-cmd/
function spawn(...command: Flag[]): Promise<number> {
  const cmd2 = str(command);

  console.log("Spawning", ...command);
  const p = child_process.spawn(cmd2[0], cmd2.slice(1));
  return new Promise((resolve, fail) => {
    p.stdout.on("data", (x) => {
      //process.stdout.write(x.toString());
    });
    p.stderr.on("data", (x) => {
      //process.stderr.write(x.toString());
    });
    p.on("exit", (code, signal) => {
      if (signal) {
        fail(signal);
      } else {
        resolve(code!); //"one of the two will always be non-null"
      }
    });
  });
}

function spawnToString(
  ...command: Flag[]
): Promise<{ exitCode: number; stdout: string }> {
  const cmd2 = str(command);

  console.log("Spawning", ...command);
  const p = child_process.spawn(cmd2[0], cmd2.slice(1));

  let stdout = "";
  return new Promise((resolve, fail) => {
    p.stdout.on("data", (x) => {
      const s = x.toString();
      //process.stdout.write(s);
      stdout += s;
    });
    p.stderr.on("data", (x) => {
      process.stderr.write(x.toString());
    });
    p.on("exit", (code, signal) => {
      if (signal) {
        fail(signal);
      } else {
        resolve({ exitCode: code!, stdout }); //"one of the two will always be non-null"
      }
    });
  });
}

const ZExif = z.object({
  //Written by exiftool
  ImageWidth: z.number().int(),
  ImageHeight: z.number().int(),

  //camera model
  Model: z.string().optional(),
  Software: z.string().optional(),

  DateTimeOriginal: z.string().transform((s) => parseExifDate(s)).optional(),
});
interface Exif extends z.infer<typeof ZExif> {}

async function parseExifWithExiftool(file: string): Promise<Exif> {
  const exiftoolResult = await spawnToString("exiftool", "-json", file);
  try {
    const exif = ZExif.parse(JSON.parse(exiftoolResult.stdout)[0]);
    return exif;
  } catch(e) {
    throw new Error("failed to parse " + exiftoolResult + " into json", {cause: e});
  }
}

function getCwebpResizeFlags(exif: Exif, max: number): Flag[] {
  const [width, height] = [exif.ImageWidth, exif.ImageHeight];

  if (width < max && height < max) {
    return [];
  }

  //Passing 0 to cwebp -resize will make it keep the image aspect ratio when resizing.
  if (width > height) {
    return ["-resize", max, 0];
  } else if (height > width) {
    return ["-resize", 0, max];
  } else {
    return ["-resize", max, max];
  }
}

//Note that cwebp will crop before resizing.
function getCwebpSquareCropFlags(exif: Exif): Flag[] {
  const [width, height] = [exif.ImageWidth, exif.ImageHeight];

  if (width == height) {
    return []; //Already square
  }

  if (width > height) {
    //Landscape
    return ["-crop", width / 2 - height / 2, 0, height, height];
  } else {
    //Portrait
    return ["-crop", 0, height / 2 - width / 2, width, width];
  }
}

function stripImgSuffix(str: string): string | undefined {
  if (str.endsWith(".png")) return str.slice(0, -4);
  else if (str.endsWith(".jpg")) return str.slice(0, -4);
  else if (str.endsWith(".jpeg")) return str.slice(0, -5);
  else return undefined;
}

function removeFailed<T>(settledResults: PromiseSettledResult<T>[]): T[] {
  const good: T[] = [];
  let bad = 0;

  for (const settledResult of settledResults) {
    if (settledResult.status == "fulfilled") good.push(settledResult.value);
    else {
      console.debug(settledResult.reason);
      bad++;
    }
  }

  console.log(bad, `error${bad == 1 ? "" : "s"}`);
  return good;
}

async function allSettledGood<T>(promises: Promise<T>[]): Promise<T[]> {
  return removeFailed(await Promise.allSettled(promises));
}

const ZBunnyCreds = z.object({
  bucketUsername: z.string(),
  bucketHostname: z.string(),
  bucketPassword: z.string(),
  cdnBaseUrl: z.string(),
});
interface BunnyCreds extends z.infer<typeof ZBunnyCreds> {}

async function main() {
  const cwd = process.cwd();

  //Read photos db
  const inPhotosDir = path.join(cwd, "in", "photos");
  const photoDbPath = path.join(inPhotosDir, "photodb.json");
  const photoDbJson = JSON.parse(
    fs.readFileSync(photoDbPath, {
      encoding: "utf-8",
    }),
  );
  const photodb: PhotoDb = ZPhotoDb.parse(photoDbJson);

  //Read bunny creds
  const bunnyCredsPath = path.join(cwd, "private", "bunny-creds.json");
  const bunnyCredsJson = JSON.parse(
    fs.readFileSync(bunnyCredsPath, { encoding: "utf-8" }),
  );
  const bunnyCreds: BunnyCreds = ZBunnyCreds.parse(bunnyCredsJson);

  if (bunnyCreds.cdnBaseUrl.endsWith("/")) {
    bunnyCreds.cdnBaseUrl = bunnyCreds.cdnBaseUrl.slice(0, -1);
  }

  const workDir = path.join(cwd, "work");
  fs.mkdirSync(workDir, { recursive: true });

  //FIRST: scan argv for things that look like image filenames
  interface Input {
    imgPath: string;
    filenameWithExt: string;
    filenameNoExt: string;
  }

  console.log("Hi");
  let inputs: Input[] = [];
  for (const imgPath of process.argv) {
    const filenameWithExt = path.basename(imgPath.toLowerCase());
    const filenameNoExt = stripImgSuffix(filenameWithExt);
    if (filenameNoExt) {
      inputs.push({ imgPath, filenameNoExt, filenameWithExt });
    }
  }
  console.log("Found", inputs.length, "image(s) to process.");

  console.log("Filtering to only fresh images...");
  for (const photo of photodb.photos) {
    inputs = inputs.filter((inp) =>
      inp.filenameWithExt != photo.original_filename
    );
  }
  console.log("Found", inputs.length, "fresh image(s).");

  if (inputs.length == 0) {
    console.log("No fresh images!");
    return;
  }

  //Read EXIF
  const exifLimiter = pLimit(4); //something explodes when trying to parse too fast??
  interface InputWithMeta extends Input {
    exif: Exif;
  }
  async function readExif(input: Input): Promise<InputWithMeta> {
    return {
      ...input,
      exif: await exifLimiter(() => parseExifWithExiftool(input.imgPath)),
    };
  }

  console.log("Reading EXIF...");
  const inputsWithMeta = await allSettledGood(inputs.map((i) => readExif(i)));

  //Process images with cwebp
  interface InputWithWebp extends InputWithMeta {
    webpLarge: string;
    webpThumb: string;
  }
  async function processImage(
    input: InputWithMeta,
  ): Promise<InputWithWebp> {
    const largeWebpOutput = path.join(
      workDir,
      input.filenameNoExt + "-large.webp",
    );

    const thumbWebpOutput = path.join(
      workDir,
      input.filenameNoExt + "-thumb.webp",
    );

    async function makeLarge(): Promise<void> {
      if(fs.existsSync(largeWebpOutput)) return;
      await spawn(
        "cwebp",
        "-q",
        "85",
        input.imgPath,
        "-o",
        largeWebpOutput,
        ...getCwebpResizeFlags(input.exif, 1000),
      );
    }

    async function makeThumb(): Promise<void> {
      if(fs.existsSync(thumbWebpOutput)) return;
      await spawn(
        "cwebp",
        "-q",
        "75",
        input.imgPath,
        "-o",
        thumbWebpOutput,
        ...getCwebpResizeFlags(input.exif, 240),
        ...getCwebpSquareCropFlags(input.exif),
      );
    }

    await Promise.all([makeLarge(), makeThumb()]);

    return {
      ...input,
      webpLarge: largeWebpOutput,
      webpThumb: thumbWebpOutput,
    };
  }
  console.log("Processing images...");
  const inputsProcessed = await allSettledGood(
    inputsWithMeta.map((i) => processImage(i)),
  );

  //Upload to Bunny
  const limiter = pLimit(4); //TODO bump this up ifthe errors subside haha
  interface UploadedInput extends InputWithWebp {
    originalUrl: string;
    largeUrl: string;
    thumbUrl: string;
  }
  async function uploadToBunny(input: InputWithWebp): Promise<UploadedInput> {
    async function up(
      targetFilename: string,
      hostFilePath: string,
    ): Promise<string> {
      //determine the content length
      const stat = fs.statSync(hostFilePath);
      const contentLength = stat.size;

      //whatever just buffer the whole file in memory
      const body = fs.readFileSync(hostFilePath);
      if(body.length == 0) {
        throw new Error("Empty file???");
      }

      //url to PUT to
      const suffix = `photos/${targetFilename}`;
      const uploadUrl =
        `https://${bunnyCreds.bucketHostname}/${bunnyCreds.bucketUsername}/${suffix}`;

      //UHHHH fix those two that weren't uploading
      //let awaw =
      //  uploadUrl == "https://ny.storage.bunnycdn.com/quaternary-files/photos/pxl_20250420_173855066.raw-02.original-thumb.webp" ||
      //  uploadUrl == "https://ny.storage.bunnycdn.com/quaternary-files/photos/pxl_20250420_180948446.raw-02.original.jpg"
      //if(!awaw) {
      //  //good
      //  return `${bunnyCreds.cdnBaseUrl}/${suffix}`;
      //}
      //if(true) return `${bunnyCreds.cdnBaseUrl}/${suffix}`;
        
      //try 5 times to upload the file
      let tries = 0;
      let result;
      do {
        result = await limiter(() => fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Length": "" + contentLength,
            "AccessKey": bunnyCreds.bucketPassword,
            "Content-Type": "application/octet-stream",
            "Accept": "application/json",
          },
          body,
        }))
        if(!result.ok) console.log("Bunny http failure", result);
        else break;
      } while (tries++ < 5)
      if(!result.ok) {
        throw new Error(`Failed to upload ${targetFilename} to Bunny`);
      }

      console.log(`Uploaded ${targetFilename} to Bunny`);
      return `${bunnyCreds.cdnBaseUrl}/${suffix}`;
    }

    const [originalUrl, largeUrl, thumbUrl] = await Promise.all([
      up(input.filenameWithExt, input.imgPath),
      up(path.basename(input.webpLarge), input.webpLarge),
      up(path.basename(input.webpThumb), input.webpThumb),
    ]);

    return { ...input, originalUrl, largeUrl, thumbUrl };
  }
  console.log("Uploading to Bunny...");
  const inputsUploaded = await allSettledGood(
    inputsProcessed.map((i) => uploadToBunny(i)),
  );
  
  console.log("Sorting by capture date...");
  inputsUploaded.sort((a, b) => compareDatesAsc(a.exif.DateTimeOriginal, b.exif.DateTimeOriginal))

  //add everything to photo db
  console.log("Writing new photo db...");
  for (const result of inputsUploaded) {
    const photo: Photo = {
      original_filename: result.filenameWithExt,

      url_thumb_quality: result.thumbUrl,
      url_large_quality: result.largeUrl,
      url_original_quality: result.originalUrl,

      capture_date: result.exif.DateTimeOriginal,
      camera: result.exif.Model,
      software: result.exif.Software,
      width: result.exif.ImageWidth,
      height: result.exif.ImageHeight,

      ...FORCED_PHOTO_PROPS,
    };
    photodb.photos.push(photo);
  }

  //save the new photo db
  const newPhotoDb = JSON.stringify(writePhotoDb(photodb), null, "\t");
  fs.writeFileSync(photoDbPath, newPhotoDb);
  
  console.log("Done");
}

if (import.meta.main) {
  main();
}
