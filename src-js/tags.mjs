export function tag(name, attrs = {}, ...contents) {
  //unwrap nested arrays (an error i kept making)
  while (contents.length == 1 && Array.isArray(contents[0]))
    contents = contents[0];

  contents = contents.filter(x => x != null && x != undefined)
    .flat(Infinity);

  let tag = { name, attrs, contents };
  tag.render = renderTag.bind(tag); //we have object oriented programming at home
  return tag;
}

export function tag2(name, callback) {
  let attrs = {};
  let contents = [];
  callback({
    a: (k, v) => attrs[k] = v,
    c: c => contents.push(c)
  });
  return tag(name, attrs, ...contents);
}

export function noEscape(text) {
  return { noEscape: true, text }
}

export function renderTag(tag, indent = 0) {
  if (!tag)
    tag = this; //allowing the bind() call to work
  if (!tag)
    throw "no tag";

  let result = "";

  //for DOCTYPE basically
  if (tag.prelude)
    result += tag.prelude;

  //opening tag and attrs
  result += `<${tag.name}`;
  if (tag.attrs) {
    for (let [k, v] of Object.entries(tag.attrs)) {
      result += ` ${k.replace("_", "-")}`;
      if(v === true)
        v = "true";
      if (isValueless(k) && v === "true")
        continue;
      result += `="${escapeAttr(v)}"`;
    }
  }
  result += `>`;

  //children
  if (tag.contents.length) {
    let doIndent = true;
    if(tag.contents.length == 1 && (typeof(tag.contents[0]) == "string" || (typeof(tag.contents[0]) == "object" && tag.contents[0].noEscape)))
      doIndent = false;
    if(tag.name == "p") //cheeky heuristic
      doIndent = false;

    for (let child of tag.contents) {
      if (doIndent)
        result += `\n${ind(indent + 1)}`;

      if (typeof (child) == "string") //immediate text
        result += escapeText(child);
      else if (child.noEscape) //result of the noEscape function
        result += child.text;
      else //assumed to be another html element
        result += renderTag(child, indent + 1);
    }

    if (doIndent)
      result += `\n${ind(indent)}`
  }

  //closing tag
  if(hasClosing(tag.name))
    result += `</${tag.name}>`
  
  return result;
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

function escapeAttr(i) {
  return (""+i).replace(/"/, "\"");
}

function escapeText(t) {
  return (""+t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
}

function ind(i) {
  return '\t'.repeat(i);
}

export const html = (a, ...c) => {
  let t = tag("html", a, ...c);
  t.prelude = "<!DOCTYPE html>\n";
  return t;
}

export const a = (a, ...c) => tag("a", a, ...c);
export const article = (a, ...c) => tag("article", a, ...c);
export const body = (a, ...c) => tag("body", a, ...c);
export const div = (a, ...c) => tag("div", a, ...c);
export const h1 = (a, ...c) => tag("h1", a, ...c);
export const h2 = (a, ...c) => tag("h2", a, ...c);
export const h3 = (a, ...c) => tag("h3", a, ...c);
export const h4 = (a, ...c) => tag("h4", a, ...c);
export const h5 = (a, ...c) => tag("h5", a, ...c);
export const h6 = (a, ...c) => tag("h6", a, ...c);
export const head = (a, ...c) => tag("head", a, ...c);
export const header = (a, ...c) => tag("header", a, ...c);
export const hr = (a, ...c) => tag("hr", a, ...c);
export const link = (a, ...c) => tag("link", a, ...c);
export const meta = (a, ...c) => tag("meta", a, ...c);
export const nav = (a, ...c) => tag("nav", a, ...c);
export const p = (a, ...c) => tag("p", a, ...c);
export const section = (a, ...c) => tag("section", a, ...c);
export const title = (a, ...c) => tag("title", a, ...c);

export const meta_ = (property, content) => meta({ property, content });
export const prose_ = (...list) => list.map(e => p({}, e)) //list of paragraphs