//html attributes
export type Attrs = Record<string, string | number | boolean>;

//things that can go inside a tag (each needs a case in show())
export type Showable = Tag | number | string;

export class Tag {
  name: string;
  attrs: Attrs;
  contents: Showable[];

  prelude: string | undefined;

  //TODO: Probably the wrong type for contents(), the flat() call is required to make the photo gallery work.
  constructor(name: string, attrs: Attrs = {}, ...contents: Showable[]) {
    this.name = name;
    this.attrs = attrs ?? {};
    this.contents = contents.flat(Infinity);

    if (name === "html") {
      this.prelude = "<!DOCTYPE html>\n";
    }
  }

  show(indent: number = 0, rss: boolean = false) {
    return show(this, indent, rss);
  }
}

const noClosing: Record<string, boolean> = {
  meta: true,
  link: true,
  hr: true,
  br: true,
  img: true,
};

function hasClosing(name: string): boolean {
  return noClosing[name] == undefined;
}

//aria_hidden="true" is required, not just aria_hidden - hmmst
const trueValueAnyway: Record<string, boolean> = {
  "aria_hidden": true,
};

function isValueless(attr: string): boolean {
  return trueValueAnyway[attr] == undefined;
}

function ind(i: number): string {
  return "\t".repeat(i);
}

export function show(
  thing: Tag | string | number,
  indent: number = 0,
  rss: boolean = false,
): string {
  if (typeof thing === "string") {
    return thing;
  } else if (typeof thing === "number") {
    return "" + thing;
  }
  
  //TODO this shouldn't happen
  if(!thing) return "";
  
  const { prelude, name, attrs, contents } = thing;
  let result = "";

  //for DOCTYPE basically
  if (prelude) {
    result += prelude;
  }

  //opening tag and attrs
  result += `<${name}`;
  for (let [k, v] of Object.entries(attrs)) {
    //key
    result += ` ${k.replace("_", "-")}`;

    v = v.toString();
    //some properties (like 'checked') don't include the ="true" part
    if (isValueless(k) && v === "true") {
      continue;
    }

    //value
    result += `="${v.replace(/"/, '"')}"`;
  }
  result += `>`;

  //children
  if (contents.length) {
    let doIndent = true;

    //TODO how 2 actually pretty print html without mucking up the formatting?
    //is it possible?
    if (contents.every((e) => !(e instanceof Tag))) { //entirely composed of literals
      doIndent = false;
    } else if (
      name == "a" || name == "p" || attrs.class === "byline" || attrs.id === "gravity"
    ) { //yeah this is bad !
      doIndent = false;
    } else if (rss) {
      doIndent = false; //yeag
    }

    //no newline between consecutive plain elements
    let lastWasSimple = false;
    for (const child of contents) {
      if (doIndent && !lastWasSimple) {
        result += `\n${ind(indent + 1)}`;
      }
      result += show(child, indent + 1, rss);

      lastWasSimple = !(child instanceof Tag);
    }

    if (doIndent) {
      result += `\n${ind(indent)}`;
    }
  }

  //closing tag
  if (rss || hasClosing(name)) {
    result += `</${name}>`;
  }

  return result;
}
