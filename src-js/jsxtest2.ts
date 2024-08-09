import * as tags from "./tags.ts"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: Record<string, any>
    }
    
    type Element = tags.Showable;
  }
}

type ValueElementFunc = (attrs: tags.Attrs, ...body: tags.TagBody[]) => tags.Showable;

//jsx magic function
export function createElement(
  tag: string | ValueElementFunc,
  props: tags.Attrs,
  ...children: tags.TagBody[]
): tags.Showable {
  if(typeof tag === "function") {
    return tag(props, ...children);
  } else {
    return new tags.Tag(tag, props, ...children);
  }
}