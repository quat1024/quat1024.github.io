slug=js_named_evaluation
title=Why can you define Javascript classes with dynamic names?
description=Examining a short Javascript snippet.
author=quat
created_date=Nov 30, 2024
---

In Javascript, you can define a class with a name chosen at runtime using this bizarre incantation:

```js
const name = "Hello";

const myClass = ({[name]: class extends Whatever {
  constructor() {
    //...
  }
  
  //...class body...
}})[name];

myClass.name; //"Hello"
```

Why does it work?

## Function names

All functions have a name string, which can be inspected with the `.name` property. Anonymous functions have an empty string for a name.

```js
console.log(Math.max.name); //"max"

function hello() {}
console.log(hello.name); //"hello"

//Note how this is written as a oneliner:
console.log(( () => {} ).name); //""
```

However, you may have noticed that anonymous functions seemingly absorb names from their environment. `const myFunc = () => {...}` is a somewhat common Javascript code style in the React world, and it would be [very reasonable to think](https://stackoverflow.com/questions/49306148/why-is-arrow-syntax-preferred-over-function-declaration-for-functional-react-com/49306604#49306604) `myFunc` would end up an anonymous function, but nope:

```js
const myFunc = () => {};
console.log(myFunc.name); //"myFunc"
```

This behavior was (maybe!) implemented by JS engines to improve the debugging experience when looking at stacktraces, and later standardized in ES6.

How does this work?

## Named evaluation

You might that evaluating an assignment would first evaluate the right hand side of the expression *in isolation*, then assign the result to the variable on the left. But this is not the case in Javascript. As a special exception, if the LHS is a simple variable and the RHS *looks like a function definition*, the function takes on the name of the variable it's assigned to.

```js
const hello = () => {}; // <- named evaluation!
console.log(hello.name); //"hello"
```

This process is called "named evaluation".

It's worth emphasizing that named evaluation is a *syntax-driven operation*, meaning that the choice to perform named evaluation is based on what the RHS *looks like*, not what it evaluates to. If the right-hand side is an expression other than a (possibly-parenthesized) function definition, it doesn't matter whether that expression ultimately evaluates to a function or not - named evaluation won't happen. (If it did, you could change the name of functions by just assigning them to variables, which would be very strange.)

```js
const hello = () => {}; // <- named evaluation!
const notNamed1 = hello;
const notNamed2 = (() => hello)();
console.log(notNamed1.name, notNamed2.name); //"hello" "hello"
```

Named evaluation does not occur on assignments whos LHS is more complex than a simple variable name; even when array-destructuring with simple names.

```js
const arr = [], obj = {};
arr[0]  = () => {};
obj.foo = () => {};
console.log(arr[0].name, obj.foo.name); //"" ""

const [a, b] = [ () => {}, () => {} ];
console.log(a.name, b.name); //"" ""
```

The right-hand side can be an arrow function, an anonymous function using the `function` keyword, an anonymous generator, or `async` versions of any of the previous. Named evaluation won't overwrite the names of functions which already have a name (`const bar = function foo () {}`), but only because this is a different syntactic form which doesn't trigger named evaluation.

The assignment operator can be `=`, or one of the short circuiting assignment operators `&&=`, `||=`, and `??=`.

[Section 8.4.5 of the spec](https://tc39.es/ecma262/2024/#sec-runtime-semantics-namedevaluation) defines what named evaluation is. I believe [13.15.2](https://tc39.es/ecma262/2024/#_ref_6368) (assignment operators), [14.13.1.2](https://tc39.es/ecma262/2024/#sec-let-and-const-declarations-runtime-semantics-evaluation) (let/const) and [14.13.2.1](https://tc39.es/ecma262/2024/#sec-variable-statement-runtime-semantics-evaluation) (var) are the relevant reasons it occurs.

## Named evaluation in object literals

Object literals also trigger named evaluation. The function takes on the name of whatever property it gets assigned to.

Computed property names using square brackets still trigger named evaluation. This is interesting, since you can put whatever expression you want on the left-hand side and still get named evaluation semantics. The name is taken from the runtime value.

```js
const obj1 = {
  abc: () => {}
};

const foo = "def";
const obj2 = {
  [foo + foo]: () => {}
};

console.log(obj1.abc.name, obj2.defdef.name) //"abc" "defdef"
```

This means we can define a function with any runtime-chosen name, without having to manually assign to the function's `name` property, by defining the function inside an object literal and immediately taking it back out. When written as a oneliner, we need an extra pair of parenthesis around the object literal.

```js
const name = prompt("choose your destiny");
const func = ({ [name]: () => {} })[name];
```

## Named evaluation on class expressions

Anonymous class syntax is rare, so as a refresher: much like how `function foo() {}` declares a named function and `function () {}` is an expression returning an anonymous one, `class Foo {}` declares a named class and `class {}` is an expression returning an anonymous one.

Named evaluation applies to assignments and object literals where the RHS is a class expression too. These both define classes with the same name.

```js
class Foo {}
const Foo = class {}
```

Since named evaluation is purely syntax-driven, it does specially handle class expressions; it's not *just* a matter of "classes are basically sugar for functions in js". Although that equivalence is probably why named evaluation was given this special case in the first place.

## Conclusion

Putting all those together is how you arrive at the snippet at the top. But why would you ever want to stamp out classes with names only known at runtime.

I'm used to Java. In the Java school of OOP, you can't *abstract over classes*; you're expected to define all classes you need up front manually. If you want something configurable you are expected to build a configuration knob into the class. This is a fine programming model, but it's forever at odds with Java's reflection capabilities; make something configurable by annotation and suddenly you find yourself copy/pasting the same class 50 times because the annotation DSL painted you into a corner.

More on-topic, this might be useful for stamping out dozens of `HTMLElement`s if you need to, since the Web Components API is similarly reflective? Most use-cases are probably handled by attributes and constructor parameters.

Although really, it's just fun to break the Java rules I've internalized for so long.
