import type { ExampleChapter } from "./types.mts";

/**
 * Runtime Enforcement (sec-runtime-enforcement and children): the runtime
 * type of a value, membership, the boundary check that guards the any type,
 * where checks are inserted and elided, typed storage, instanceof, and typed
 * catch clauses. All outputs verified by scripts/validate-examples.mts.
 */
export const enforcement: ExampleChapter = [
  {
    section: "sec-runtime-enforcement",
    title: "The check at the any boundary",
    summary: "A value reaches a typed position with its type unknown only through any; the boundary is where the violation surfaces.",
    code: "let boxed: any = 300;\nlet a: uint8 = boxed;",
    throws: true,
    expected: "",
  },
  {
    section: "sec-runtime-type-of-a-value",
    title: "Every value has a runtime type",
    summary: "A typed value carries its type; an untyped 5 is a number.",
    code: "let a: uint8 = 5;\nconsole.log(Reflect.typeOf(a) === uint8, Reflect.typeOf(5) === number);",
    expected: "true true",
  },
  {
    section: "sec-runtimetypeof",
    title: "RuntimeTypeOf on the existing types",
    code: 'console.log(Reflect.typeOf("x") === string, Reflect.typeOf(5n) === bigint);',
    expected: "true true",
  },
  {
    section: "sec-type-membership",
    title: "Membership in a union",
    summary: "A value belongs to a union if it belongs to a member; 3.5 is neither a uint8 nor a string.",
    code: 'type U = uint8 | string;\nconsole.log("hi" instanceof U, (5 := uint8) instanceof U, 3.5 instanceof U);',
    expected: "true true false",
  },
  {
    section: "sec-isoftype",
    title: "Membership in a literal type",
    summary: "IsOfType for a literal type is value equality with its one value.",
    code: "type Five = 5;\nconsole.log(5 instanceof Five, 6 instanceof Five);",
    expected: "true false",
  },
  {
    section: "sec-the-boundary-check",
    title: "The wrong kind is a TypeError",
    summary: "Out-of-range numbers are RangeErrors; a value of the wrong type entirely is a TypeError - and the message points at parse.",
    code: 'let boxed: any = "hi";\nlet a: uint8 = boxed;',
    throws: true,
    expected: "",
  },
  {
    section: "sec-requiretype",
    title: "A passing check converts",
    summary: "RequireType at the argument boundary hands the function a value of the parameter's type.",
    code: "function f(x: uint8) { return x; }\nlet boxed: any = 9;\nconsole.log(f(boxed) instanceof uint8);",
    expected: "true",
  },
  {
    section: "sec-check-insertion",
    title: "A callback takes its parameter types from the position, and the copy keeps them",
    summary: "The literal's parameters come from the position it stands in, so a callback needs no annotations. The RESULT keeps the element type too - a method that copies from a typed array copies its type with it, which is what stops `filter` handing back something that accepts anything.",
    code: "const a: [].<uint8> = [1, 2, 3];\nconsole.log(a.map((x) => x + (1 := uint8))[0]);\nconsole.log(a.filter((x) => x > (1 := uint8))[0]);\nconsole.log(Reflect.typeOf(a.filter((x) => x > (1 := uint8))[0]) === uint8);",
    expected: "2 (typed)\n2 (typed)\ntrue",
  },
  {
    section: "sec-check-insertion",
    title: "A function literal is checked where it stands",
    summary: "An argument is a check site, and a literal written at one is checked like anything else - a written return that does not match is refused before anything runs, which is why nothing prints.",
    code: "function h(f: (x: uint8) => uint8) { return \"took\"; }\nh((x: uint8): string => \"wrong\");",
    throws: true,
    expected: "",
  },
  {
    section: "sec-check-insertion",
    title: "Returns are boundaries too",
    summary: "An any value crossing a declared return type is checked exactly like an assignment.",
    code: "function get(): uint8 { let boxed: any = 300; return boxed; }\nget();",
    throws: true,
    expected: "",
  },
  {
    section: "sec-check-elision",
    title: "Known types need no check",
    summary: "uint8 to uint8 is established statically, so no runtime check exists here - only any and literals need the boundary.",
    code: "let a: uint8 = 5;\nlet b: uint8 = a;\nconsole.log(b);",
    expected: "5 (typed)",
  },
  {
    section: "sec-typed-storage",
    title: "A typed property",
    summary: "A property descriptor may carry a type: it defaults, and every store is checked.",
    code: 'let o = {};\nObject.defineProperty(o, "x", { type: uint8, writable: true });\nconsole.log(o.x);\no.x = 300;',
    throws: true,
    expected: "0 (typed)",
  },
  {
    section: "sec-typed-storage",
    title: "Typed fields cannot be deleted",
    summary: "A class with a typed field is sealed and the field is load-bearing; delete is refused.",
    code: "class P { x: uint8 = (1 := uint8); }\nconst p = new P();\nconsole.log(delete p.x);",
    throws: true,
    expected: "",
  },
  {
    section: "sec-instanceof-for-type-objects",
    title: "instanceof asks membership",
    summary: "A typed value is an instance of its type; a bare 200 is a number, not a uint8; string membership needs no annotation.",
    code: 'let a: uint8 = 200;\nconsole.log(a instanceof uint8, 200 instanceof uint8, "hi" instanceof string);',
    expected: "true false true",
  },
  {
    section: "sec-typed-catch",
    title: "catch by error type",
    summary: "Typed catch clauses select by membership, in order; the unmatched clause is skipped.",
    code: 'try { throw new RangeError("out of range"); }\ncatch (e: TypeError) { console.log("type error"); }\ncatch (e: RangeError) { console.log("caught:", e.message); }',
    expected: "'caught:' 'out of range'",
  },
];
