//TODO tidy this shit up! it's loosely converted from plain js so the types are real messy
//didnt intend for it to be used with jsx

export interface Showable {
  show(indent: number): string
}

export type Attrs = Record<string, string | number | boolean>;
export type TagBody = Showable | string | undefined;

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

  constructor(name: string, attrs: Attrs = {}, ...contents: TagBody[]) {  
    //remove nulls and flatten
    const contentsProcessed = contents
      .flat(Infinity)
      .filter(obj => obj !== null && obj !== undefined)
      .map(obj => {
        if(obj instanceof LiteralString || obj instanceof EscapedString || obj instanceof Tag) {
          return obj;
        //} else return contentsNeedEscaping(name) ? new EscapedString(obj.toString()) : new LiteralString(obj.toString());
        } else return new LiteralString(obj.toString()); //TODO it's re-escaping my rendered markdown
      }) as Showable[]; //TODO clunky typecast
    
    this.name = name;
    this.attrs = attrs ?? {};
    this.contents = contentsProcessed;
    
    if(name === "html") {
      this.prelude = "<!DOCTYPE html>\n"
    }
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
      if(this.contents.every(e => !(e instanceof Tag))) //entirely composed of literals
        doIndent = false;
      else if (this.name == "p" || this.attrs.class === "byline") //yeah this is bad !
        doIndent = false;

      //no newline between consecutive plain elements
      let lastWasSimple = false;
      for (const child of this.contents) {
        if (doIndent && !lastWasSimple)
          result += `\n${ind(indent + 1)}`;
        result += child.show(indent + 1);
        
        lastWasSimple = !(child instanceof Tag);
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
