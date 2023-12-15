//javascript moment
function instanceofString(obj) {
  return obj instanceof String || typeof(obj) == "string";
}

export class NoEscape {
  s;

  constructor(s) {
    this.s = s;
  }
  
  renderToString(indent = 0) {
    return this.s;
  }
}

export class Escape {
  s;
  
  constructor(s) {
    this.s = s;
  }
  
  renderToString(indent = 0) {
    return this.s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }
}

export class Tag {
  name; //String
  attrs; //Object
  contents; //[Tag | NoEscape | Escaped]
  
  prelude; //string, basically just for DOCTYPE

  constructor(name, attrs = {}, ...contents) {  
    //remove nulls and flatten
    contents = contents
      .flat(Infinity)
      .filter(obj => obj !== null && obj !== undefined)
      .map(obj => instanceofString(obj) ? new Escape(obj) : obj);
    
    this.name = name;
    this.attrs = attrs;
    this.contents = contents;
  }

  renderToString(indent = 0) {
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
        
        //some properties (like 'checked') don't include the ="true" part
        if (v === true)
          v = "true";
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
      
      if(this.contents.length == 1 && (this.contents[0] instanceof NoEscape || this.contents[0] instanceof Escape))
        doIndent = false;
      else if (this.name == "p") //cheeky heuristic
        doIndent = false;

      for (let child of this.contents) {
        if (doIndent)
          result += `\n${ind(indent + 1)}`;
        result += child.renderToString(indent + 1);
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

const noClosing = {
  meta: true,
  link: true,
  hr: true
};

function hasClosing(name) {
  return noClosing[name] == undefined;
}

const trueValueAnyway = {
  "aria_hidden": true
}

function isValueless(attr) {
  return trueValueAnyway[attr] == undefined;
}

function ind(i) {
  return '\t'.repeat(i);
}

//shorthand
export function tag(name, attrs = {}, ...contents) {
  return new Tag(name, attrs, ...contents);
}

//shorthand
export function noEscape(text) {
  return new NoEscape(text);
}

//very shorthand
export const html = (a, ...c) => {
  let t = new Tag("html", a, ...c);
  t.prelude = "<!DOCTYPE html>\n";
  return t;
}
export const a = (a, ...c) => new Tag("a", a, ...c);
export const article = (a, ...c) => new Tag("article", a, ...c);
export const body = (a, ...c) => new Tag("body", a, ...c);
export const div = (a, ...c) => new Tag("div", a, ...c);
export const h1 = (a, ...c) => new Tag("h1", a, ...c);
export const h2 = (a, ...c) => new Tag("h2", a, ...c);
export const h3 = (a, ...c) => new Tag("h3", a, ...c);
export const h4 = (a, ...c) => new Tag("h4", a, ...c);
export const h5 = (a, ...c) => new Tag("h5", a, ...c);
export const h6 = (a, ...c) => new Tag("h6", a, ...c);
export const head = (a, ...c) => new Tag("head", a, ...c);
export const header = (a, ...c) => new Tag("header", a, ...c);
export const hr = (a, ...c) => new Tag("hr", a, ...c);
export const link = (a, ...c) => new Tag("link", a, ...c);
export const meta = (a, ...c) => new Tag("meta", a, ...c);
export const nav = (a, ...c) => new Tag("nav", a, ...c);
export const p = (a, ...c) => new Tag("p", a, ...c);
export const section = (a, ...c) => new Tag("section", a, ...c);
export const title = (a, ...c) => new Tag("title", a, ...c);

export const meta_ = (property, content) => meta({ property, content });
export const prose_ = (...list) => list.map(e => p({}, e)) //list of paragraphs