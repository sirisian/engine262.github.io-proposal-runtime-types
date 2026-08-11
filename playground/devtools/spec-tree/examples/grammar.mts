import type { ExampleChapter } from "./types.mts";

/**
 * Grammar (sec-type-grammar and children): the lexical additions, type
 * expressions and their operators, keyof, type parameters, annotations, and
 * types in expression position. All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const grammar: ExampleChapter = [
  {
    section: "sec-type-grammar",
    title: "The type operator resolves the collision",
    summary: "An object type would read as a block in expression position; the type operator parses its operand as a type.",
    code: "console.log(typeof (type { x: uint8 }), typeof uint8);",
    expected: "'object' 'object'",
  },
  {
    section: "sec-lexical-grammar-for-types",
    title: "The lexicon coexists",
    summary: "Template literals are untouched, and := is one token converting its left operand.",
    code: 'console.log(`a${1}b`, ("s" := string));',
    expected: "'a1b' 's'",
  },
  {
    section: "sec-type-punctuators",
    title: "The .< and := punctuators",
    summary: ".< opens type arguments where < alone would compare; := converts in place.",
    code: 'function f() { return "seven"; }\nconsole.log(f.<uint8>(), (5 := uint8));',
    expected: "'seven' 5 (typed)",
  },
  {
    section: "sec-imaginary-literals",
    title: "The i suffix (not yet in the engine)",
    summary: "2.5i should lex as an imaginary literal of the complex family; the engine refuses the token (KNOWN-DIVERGENCES.md D10).",
    code: "let z = 2.5i;",
    throws: true,
    expected: "",
  },
  {
    section: "sec-input-element-type",
    title: "Comparison survives next door",
    summary: "The goal symbol keeps .< for type arguments and < for less-than in the same program.",
    code: 'const pairs = new Map.<string, uint8>();\npairs.set("a", 1);\nconsole.log(pairs.size, pairs.get("a"), 3 < 5);',
    expected: "1 1 (typed) true",
  },
  {
    section: "sec-type-expressions",
    title: "Forms compose",
    summary: "An array type unions with null; membership follows the composed type.",
    code: "type T = ([].<uint8>) | null;\nlet a: [].<uint8> = [1];\nconsole.log(a is T, null is T, [1] is T);",
    expected: "true true false",
  },
  {
    section: "sec-type-references",
    title: "A reference with arguments",
    summary: "Map.<string, uint8> is one type reference, usable in an alias and after new.",
    code: 'type Dict = Map.<string, uint8>;\nconst d: Dict = new Map.<string, uint8>();\nd.set("a", 1);\nconsole.log(d.get("a"));',
    expected: "1 (typed)",
  },
  {
    section: "sec-computed-types",
    title: "A call of a call",
    summary: "The spec's own phrase: a function returning a function that computes a type is still a type position.",
    code: "function id(T) { return T; }\nfunction wrap(T) { return id; }\ntype Q = wrap(uint8)(uint16);\nconsole.log(Q === uint16);",
    expected: "true",
  },
  {
    section: "sec-keyof",
    title: "The keys of an object type",
    code: 'type A = { a: uint8, b: string };\ntype K = keyof A;\nconsole.log("a" is K, "b" is K, "c" is K);',
    expected: "true true false",
  },
  {
    section: "sec-keytypesof",
    title: "An enum's keys live on typeof",
    summary: "keyof typeof C is the member names; keyof C is the keys of the member values, which have none.",
    code: 'enum C { Zero }\ntype K = keyof typeof C;\ntype V = keyof C;\nconsole.log("Zero" is K, "Zero" is V);',
    expected: "true false",
  },
  {
    section: "sec-array-and-tuple-types",
    title: "Extents and element lists",
    summary: "[2].<uint8> fixes the length; [uint8, string] fixes each position.",
    code: 'let f: [2].<uint8> = [1, 2];\nlet t: [uint8, string] = [1, "x"];\nconsole.log(f.length, t[1]);',
    expected: "2 (typed) 'x'",
  },
  {
    section: "sec-object-types",
    title: "readonly is covariant in depth",
    summary: "The flag reflects, and a readonly member accepts a subtype where a writable one would not (writes through it should be refused: KNOWN-DIVERGENCES.md D7).",
    code: "type Src = { readonly x: uint8 };\ntype RO = { readonly x: uint8 | string };\nconsole.log(Reflect.getReflection(Src).properties[0].readonly, Reflect.isAssignable(Src, RO));",
    expected: "true true",
  },
  {
    section: "sec-function-types",
    title: "Optional parameters",
    code: "type F = (a: uint8, b?: string) => void;\nconst s = Reflect.getReflection(F).signatures[0];\nconsole.log(s.parameters.length, s.parameters[1].optional);",
    expected: "2 true",
  },
  {
    section: "sec-type-parameters",
    title: "A parameter, inferred and explicit",
    summary: "T binds from the argument's element type, or explicitly with .<uint8>.",
    code: "function first<T>(items: [].<T>): T { return items[0]; }\nlet a: [].<uint8> = [7];\nconsole.log(first(a) is uint8, Number(first.<uint8>(a)));",
    expected: "true 7",
  },
  {
    section: "sec-computed-constraints",
    title: "A constraint admits",
    code: "function clamp<T extends uint8 | uint16>(x: T) { return x; }\nconsole.log(clamp((5 := uint8)) is uint8);",
    expected: "true",
  },
  {
    section: "sec-computed-constraints",
    title: "A constraint refuses",
    summary: "string is outside the constraint, so the call is a checker error.",
    code: 'function clamp<T extends uint8 | uint16>(x: T) { return x; }\nclamp("s");',
    throws: true,
    expected: "",
  },
  {
    section: "sec-type-annotations",
    title: "Annotations on fields and accessors",
    code: "class C {\n  x: uint8 = 3;\n  get double(): uint8 { return this.x + this.x; }\n}\nconsole.log(new C().double);",
    expected: "6 (typed)",
  },
  {
    section: "sec-types-in-expression-position",
    title: "A type name is an expression",
    summary: "uint8 is a value, since a type is a value.",
    code: "let t: type = uint8;\nconsole.log(t is type, (type) is type, 5 is type);",
    expected: "true true false",
  },
  {
    section: "sec-types-in-expression-position",
    title: "The operator resolves the collisions",
    summary: "A function type would read as an arrow, an object type as a block, a tuple as an array literal, and a union as a bitwise or - so the operator parses its operand as a type.",
    code: "type Fn = (uint8) => uint8;\ntype Obj = { x: uint8 };\ntype Tup = [uint8, uint8];\ntype Uni = uint8 | string;\nconsole.log((type (uint8) => uint8) === Fn, (type { x: uint8 }) === Obj, (type [uint8, uint8]) === Tup, (type uint8 | string) === Uni);",
    expected: "true true true true",
  },
  {
    section: "sec-types-in-expression-position",
    title: "A binding named type keeps its value reading",
    summary: "Where the operator claims a token, the program parenthesizes the name to mean the value instead - the trade the clause makes by leaving these operands to the operator.",
    code: 'const type = ["a", "b"];\nconsole.log((type)[0], (type).length);',
    expected: "'a' 2",
  },
  {
    section: "sec-types-in-expression-position",
    title: "A call is refined out of the cover",
    summary: "After the operator, parenthesized text could be a function type's parameters or a call's arguments; the token after the closing parenthesis decides, so a call of a function named type survives - named arguments included.",
    code: 'function type(x) { return "call:" + String(x === uint8); }\nconsole.log(type (uint8));\nconsole.log(type (x: uint8));',
    expected: "'call:true'\n'call:true'",
  },
  {
    section: "sec-types-in-expression-position",
    title: "Conversion and membership inline",
    code: 'console.log((3 := uint8) is uint8, 3 is uint8, "s" is uint8);',
    expected: "true false false",
  },
  {
    section: "sec-type-arguments-and-placement-new-in-expression-position",
    title: "Type arguments keep the receiver",
    summary: "o.m.<uint8>() is one member expression, so this stays bound (placement new pairs with the memory-layout chapter).",
    code: 'const o = { m() { return this === o ? "bound" : "lost"; } };\nconsole.log(o.m.<uint8>());',
    expected: "'bound'",
  },
];
