//javascript moment
function instanceofString(obj: unknown): obj is string {
  return obj instanceof String || typeof(obj) == "string";
}

export interface Showable {
  show(indent: number): string
}

export type Attrs = Record<string, string | number | boolean>;

export class LiteralString implements Showable {
  s: string;

  constructor(s: string) {
    this.s = s;
  }
  
  show(_indent = 0): string {
    return this.s;
  }
}

export class EscapedString implements Showable {
  s: string;
  
  constructor(s: string) {
    this.s = s;
  }
  
  show(_indent = 0) {
    return this.s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }
}

export class Tag implements Showable {
  name: string;
  attrs: Attrs;
  contents: Showable[];
  
  prelude: string | undefined;

  constructor(name: string, attrs: Attrs = {}, ...contents: (object | undefined)[]) {  
    //remove nulls and flatten
    const contentsProcessed = contents
      .flat(Infinity)
      .filter(obj => obj !== null && obj !== undefined)
      .map(obj => {
        if(instanceofString(obj)) {
          return contentsNeedEscaping(name) ? new EscapedString(obj) : new LiteralString(obj);
        } else return obj;
      }) as Showable[]; //TODO clunky typecast
    
    this.name = name;
    this.attrs = attrs;
    this.contents = contentsProcessed;
  }

  show(indent = 0) {
    let result = "";

    //for DOCTYPE basically
    if (this.prelude)
      result += this.prelude;

    //opening tag and attrs
    result += `<${this.name}`;
    if (this.attrs) {
      for (let [k, v] of Object.entries(this.attrs)) {
        //key
        result += ` ${k.replace("_", "-")}`;
        v = v.toString();
        
        //some properties (like 'checked') don't include the ="true" part
        if (isValueless(k) && v === "true")
          continue;
        
        //value
        result += `="${v.replace(/"/, "\"")}"`;
      }
    }
    result += `>`;

    //children
    if (this.contents.length) {
      let doIndent = true;
      
      //TODO how 2 actually pretty print html without mucking up the formatting?
      //is it possible?
      if(this.contents.length == 1 && (this.contents[0] instanceof LiteralString || this.contents[0] instanceof EscapedString))
        doIndent = false;
      else if (this.name == "p" || this.attrs.class === "byline") //yeah this is dumb
        doIndent = false;

      for (const child of this.contents) {
        if (doIndent)
          result += `\n${ind(indent + 1)}`;
        result += child.show(indent + 1);
      }

      if (doIndent)
        result += `\n${ind(indent)}`
    }

    //closing tag
    if (hasClosing(this.name))
      result += `</${this.name}>`

    return result;
  }
}

const noClosing: Record<string, boolean> = {
  meta: true,
  link: true,
  hr: true,
  br: true,
}

function hasClosing(name: string): boolean {
  return noClosing[name] == undefined;
}

const noEscaping: Record<string, boolean> = {
  script: true
}

function contentsNeedEscaping(name: string): boolean {
  return noEscaping[name] == undefined;
}

//aria_hidden="true" is required, not just aria_hidden - hmmst
const trueValueAnyway: Record<string, boolean> = {
  "aria_hidden": true
}

function isValueless(attr: string): boolean {
  return trueValueAnyway[attr] == undefined;
}

function ind(i: number): string {
  return '\t'.repeat(i);
}

//shorthand
export function tag(name: string, attrs = {}, ...contents: Showable[]): Tag {
  return new Tag(name, attrs, ...contents);
}

//shorthand
export function noEscape(text: string): LiteralString {
  return new LiteralString(text);
}

//very shorthand
export const html = (a: Attrs, ...c: Showable[]): Tag => {
  const t = new Tag("html", a, ...c);
  t.prelude = "<!DOCTYPE html>\n";
  return t;
}
export const a = (a: Attrs, ...c: Showable[]): Tag => new Tag("a", a, ...c);
export const br = (a: Attrs, ...c: Showable[]): Tag => new Tag("br", a, ...c);
export const article = (a: Attrs, ...c: Showable[]): Tag => new Tag("article", a, ...c);
export const body = (a: Attrs, ...c: Showable[]): Tag => new Tag("body", a, ...c);
export const div = (a: Attrs, ...c: Showable[]): Tag => new Tag("div", a, ...c);
export const h1 = (a: Attrs, ...c: Showable[]): Tag => new Tag("h1", a, ...c);
export const h2 = (a: Attrs, ...c: Showable[]): Tag => new Tag("h2", a, ...c);
export const h3 = (a: Attrs, ...c: Showable[]): Tag => new Tag("h3", a, ...c);
export const h4 = (a: Attrs, ...c: Showable[]): Tag => new Tag("h4", a, ...c);
export const h5 = (a: Attrs, ...c: Showable[]): Tag => new Tag("h5", a, ...c);
export const h6 = (a: Attrs, ...c: Showable[]): Tag => new Tag("h6", a, ...c);
export const head = (a: Attrs, ...c: Showable[]): Tag => new Tag("head", a, ...c);
export const header = (a: Attrs, ...c: Showable[]): Tag => new Tag("header", a, ...c);
export const hr = (a: Attrs, ...c: Showable[]): Tag => new Tag("hr", a, ...c);
export const li = (a: Attrs, ...c: Showable[]): Tag => new Tag("li", a, ...c);
export const link = (a: Attrs, ...c: Showable[]): Tag => new Tag("link", a, ...c);
export const meta = (a: Attrs, ...c: Showable[]): Tag => new Tag("meta", a, ...c);
export const nav = (a: Attrs, ...c: Showable[]): Tag => new Tag("nav", a, ...c);
export const p = (a: Attrs, ...c: Showable[]): Tag => new Tag("p", a, ...c);
export const script = (a: Attrs, ...c: Showable[]): Tag => new Tag("script", a, ...c);
export const section = (a: Attrs, ...c: Showable[]): Tag => new Tag("section", a, ...c);
export const span = (a: Attrs, ...c: Showable[]): Tag => new Tag("span", a, ...c);
export const title = (a: Attrs, ...c: Showable[]): Tag => new Tag("title", a, ...c);
export const ul = (a: Attrs, ...c: Showable[]): Tag => new Tag("ul", a, ...c);

export const meta_ = (property: string, content: string): Tag => meta({ property, content });
export const prose_ = (...list: Showable[]): Tag[] => list.map(e => p({}, e)) //list of paragraphs