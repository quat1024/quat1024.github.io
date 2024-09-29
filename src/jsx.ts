import * as tags from "./tags.ts"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: tags.Attrs
    }
    
    type Element = tags.Showable;
  }
}

type ValueElementFunc = (props: tags.Attrs, ...body: tags.Showable[]) => tags.Showable;

//jsx magic function
export function createElement(
  tag: string | ValueElementFunc,
  props: tags.Attrs,
  ...children: tags.Showable[]
): tags.Showable {
  if(typeof tag === "function") {
    return tag(props, ...children);
  } else {
    return new tags.Tag(tag, props, ...children);
  }
}

//TODO: fragment

//according to https://docs.deno.com/runtime/manual/advanced/jsx_dom/jsx/
//deno's defaults look like this
//"compilerOptions": {
//  "jsx": "react",
//  "jsxFactory": "React.createElement", //configurable thru /** @jsx func */
//  "jsxFragmentFactory": "React.Fragment" //configurable thru /** @jsxFrag func */
//}
//
//some of that is configurable per-file thru doc comments.
//Typescript docs don't talk about the shape the jsxFactory function should have..!
//Basically it works like "React.createElement(type, props, ...children)"
//where type is a string (or maybe smtn else?), props is an object {} representing the html
//key-value pairs, and children is a list of children, which can be strings or other elements.
//
//tsc basically pastes in the contents of jsxFactory. If you set jsxFactory to
//"React.createElement" it expects something in-scope named React which has a property
//createElement which has the correct function signature. It is p much textual
//substitution and you will need to import the corresponding item at the top of your file.
//
//If you're *not* using React, it's probably easier to define jsxFactory as a free function,
//which I've done by naming it just "createElement" in my deno.json. At the top of the file
//I've imported that function.
//
//This is enough for JSX but not enough for typesafe JSX. The official docs go over how it works
//https://www.typescriptlang.org/docs/handbook/jsx.html#configuring-jsx
//It's configured with the magic typescript namespace JSX. Typescript namespaces are a bit of an
//old/semi-deprecated feature, and the "declare namespace JSX" syntax did not work for me, but
//putting it in a different file inside a "declare global {}" block did work.
//
//Intrinsic elements are html elements not defined in your program that don't have any special
//behavior. Think div, h1, span. Value-based elements are elements backed by a class or function.
//They have slighly different behavior, for example `<div>` should pass the string "div" to the
//JSX function, but `<MyComponent>` should pass the whole MyComponent function or class along
//without stringifying it.
//
//Intrinsic elements are typechecked against the JSX.IntrinsicElements interface in a manner
//that's kind of hard to explain in words... but if you write
//`interface IntrinsicElements { div: { id?: string } }`,
//you can write the <div> tag, and optionally give it an "id" attr as long as it's a string.
//Children are not typechecked, any element can have a bunch of children.
//If you don't want to play this game, you can set IntrinsicElements to something like
//[elemName: string]: any. There might be some package containing types for all standard
//HTML elements somewhere. Probably in react...
//
//Value based elements begin with a capital letter and must correspond to an in-scope identifier.
//If that identifier resolves to a function, Typescript checks that the return type is assignable
//to JSX.Element
//
//Things TS seemingly doesn't check?
// - That the return type of your createElement function is assignable to JSX.Element
// - 
//
//To recap:
// - set jsxFactory in deno.json to control what function call JSX compiles to
// - declare the namespace JSX and write things in the IntrinsicElements namespace to control
//   plain, lowercase html elements
// - write functions that take an options object in their first param, and that return things
//   assignable to JSX.Element, to create your own elements