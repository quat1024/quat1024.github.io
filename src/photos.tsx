import { z } from "zod";
import * as t from "./tags.ts";
import { Layout2 } from "./templates.tsx"
import { createElement } from "./jsx.ts";
import { parseDate, writeDate } from "./date.ts";

export const ZPhoto = z.object({
  original_filename: z.string(),

  url_thumb_quality: z.string(),
  url_large_quality: z.string(),
  url_original_quality: z.string(),

  capture_date: z.string().transform(s => parseDate(s)).optional(),
  camera: z.string().optional(),
  software: z.string().optional(),
  width: z.number().int(),
  height: z.number().int(),

  category: z.string().optional(),
});
//interface, so this becomes a nameable type instead of a giant tuple
//affects IDE autocomplete and error messages :)
export interface Photo extends z.infer<typeof ZPhoto> { }

export function writePhoto(photo: Photo): object {
  if (photo.capture_date) {
    return {
      ...photo,
      capture_date: writeDate(photo.capture_date),
    }
  } else return photo;
}

export function safePhotoName(photo: Photo): string {
  return photo.original_filename.replace(/[^A-Za-z0-9_-]/g, "");
}

export function photoUrlPath(photo: Photo): string {
  return "/photos/" + safePhotoName(photo);
}

///

export const ZPhotoDb = z.object({
  photos: ZPhoto.array(),
  categoryNames: z.record(z.string(), z.string())
});
export type PhotoDb = z.infer<typeof ZPhotoDb>;

export function writePhotoDb(photodb: PhotoDb): object {
  return {
    photos: photodb.photos.map(p => writePhoto(p)),
    categoryNames: photodb.categoryNames,
  }
}

//TODO: stable ordering
export function organizePhotos(photodb: PhotoDb): Record<string, Photo[]> {
  const collate: Record<string, Photo[]> = {};

  for (const photo of photodb.photos) {
    const cat = photo.category || "Other";
    if (!collate[cat]) collate[cat] = [];
    collate[cat].push(photo);
  }

  //No need to sort the photos b/c they should come out of the photos array
  //in the "right" order. To reorder photos just manually mess with that
  //array

  // for (const key of Object.keys(collate)) {
  //   collate[key].sort((a, b) => compareDatesAsc(a.capture_date, b.capture_date));
  // }

  return collate;
}

export function prettyCategory(photodb: PhotoDb, cat: string): string {
  return photodb.categoryNames[cat] || cat;
}

///////////

function Thumbnail(props: { photo: Photo }): t.Showable {
  const p = props.photo;

  return <a href={photoUrlPath(p)}>
    <img class="photogrid-thumbnail" src={p.url_thumb_quality} loading="lazy" />
  </a>
}

export function PhotoPage(props: { photo: Photo }): t.Showable {
  const p = props.photo;

  const tableRows = [];
  if (p.capture_date) tableRows.push(<tr><th>Date</th><td>{writeDate(p.capture_date)}</td></tr>);
  if (p.camera) tableRows.push(<tr><th>Camera</th><td>{p.camera}</td></tr>);
  if (p.software) tableRows.push(<tr><th>Software</th><td>{p.software}</td></tr>);

  let table: t.Showable[];
  if (tableRows.length > 0) table = [<table class="photo-metadata">{...tableRows}</table>];
  else table = [];

  return <Layout2 title={p.original_filename}>
    <article class="photopage">
      <figure>
        <a href={p.url_original_quality}>
          <img src={p.url_large_quality} class="photo" />
        </a>
        <figcaption>Click to view original ({p.width}&times;{p.height}px)</figcaption>
      </figure>
      {...table}
    </article>
  </Layout2>
}

export function Gallery2(props: { photodb: PhotoDb }): t.Showable {
  //TODO: fix the fragments <> </>.

  const organized = organizePhotos(props.photodb);
  const blah = [];
  for (const category of Object.keys(organized)) {
    blah.push(
      <div>
        <h2>{prettyCategory(props.photodb, category)}</h2>
        <div class="photogrid">
          {organized[category].map(photo => <Thumbnail photo={photo} />)}
        </div>
      </div>
    );
  }

  return <Layout2 title="Photos" description="My photos.">
    <article>
      <h1>Photos</h1>
      <p>Oh, this is ostensibly a technical blog. Um, I'll post about how this gallery works (and fix the sideways thumbnails) later, but basically the images are taken on my phone, edited in Snapseed, processed locally on my computer with <a href="https://github.com/quat1024/quat1024.github.io/blob/master/src/photos_add.ts">this janky Deno script</a> that shells out to <code>cwebp</code> and <code>exiftool</code>, and uploaded to the <a href="https://bunny.net">Bunny</a> CDN.</p>
      <div class="gallery">
        {...blah}
      </div>
    </article>
  </Layout2>
}