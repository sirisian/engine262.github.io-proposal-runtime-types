import type { ExampleChapter } from "./types.mts";

/**
 * Runtime Types intro, Conventions, and Type System Foundations
 * (sec-runtime-types through sec-type-errors). Every code string was verified
 * against the built engine by scripts/validate-examples.mts; `expected` is the
 * harness-side inspect() rendering of the console calls.
 *
 * sec-deferred-applications is intentionally not covered here: an honest
 * example needs an unbound generic parameter, so it lands with the generics
 * batch.
 */
export const foundations: ExampleChapter = [
  {
    section: "sec-runtime-types",
    title: "A typed binding",
    summary: "Annotate a binding and the value it holds is a typed value.",
    code: 'let a: uint8 = 250;\nconsole.log(a + 5);',
    expected: "255 (typed)",
  },
  {
    section: "sec-conventions",
    title: "Untyped code is untouched",
    summary: "The proposal is a diff: a program with no annotations keeps today's behavior.",
    code: 'let loose = 5;\nloose = "now a string";\nconsole.log(loose);',
    expected: "'now a string'",
  },
  {
    section: "sec-type-system-foundations",
    title: "The gradual boundary",
    summary: "An any value entering a typed position is checked and converted at the boundary.",
    code: "let boxed: any = 200;\nlet a: uint8 = boxed;\nconsole.log(a, a instanceof uint8);",
    expected: "200 (typed) true",
  },
  {
    section: "sec-types-and-type-objects",
    title: "Types are values",
    summary: "A type is an ordinary object; a binding that holds one works in an annotation.",
    code: "console.log(typeof uint8);\nconst T = uint8;\nlet x: T = 7;\nconsole.log(x instanceof uint8);",
    expected: "'object'\ntrue",
  },
  {
    section: "sec-structural-identity",
    title: "Structurally identical means the same object",
    summary: "Type Objects are interned: two spellings of one structure compare ===.",
    code: "type A = { x: uint8 };\ntype B = { x: uint8 };\nconsole.log(A === B);",
    expected: "true",
  },
  {
    section: "sec-sametype",
    title: "SameType through an alias",
    summary: "An alias is transparent: it names a type, it does not create one.",
    code: "type A = uint8;\ntype B = A;\nconsole.log(A === B, A === uint16);",
    expected: "true false",
  },
  {
    section: "sec-sametypewithassumptions",
    title: "Comparing recursive types",
    summary:
      "Two separately declared linked lists are one type. Comparing them re-enters the same pair of records, and the assumption list is what lets that answer instead of looping.",
    code: "type L1 = { value: uint8, next: L1 | null };\ntype L2 = { value: uint8, next: L2 | null };\nconsole.log(L1 === L2);",
    expected: "true",
  },
  {
    section: "sec-sametypelist",
    title: "Element lists compare pairwise",
    summary: "Two tuple types are the same type when their element lists match.",
    code: "type T1 = [uint8, string];\ntype T2 = [uint8, string];\nconsole.log(T1 === T2);",
    expected: "true",
  },
  {
    section: "sec-sameargumentlist",
    title: "Compound arguments compare by structure",
    summary:
      "A computed type's argument list uses structural equivalence, so a fresh array of the same constants names the same application.",
    code: 'function tagged(name, keys) {\n  return Reflect.makeType({ kind: "object", properties: keys.map(k => ({ name: k, type: string })) });\n}\ntype A = tagged("user", ["id", "name"]);\ntype B = tagged("user", ["id", "name"]);\nconsole.log(A === B);',
    expected: "true",
  },
  {
    section: "sec-canonicalizetype",
    title: "Canonical forms",
    summary: "Aliases of one primitive and reorderings of one union canonicalize to one type - and the same canonical form answers whether it is reached through a type alias or written directly where a value is expected.",
    code: "console.log(int.<8> === int8);\ntype U1 = (uint8 | string) | uint16;\ntype U2 = uint16 | (string | uint8);\nconsole.log(U1 === U2);\nconsole.log(vector.<float32, 4> === float32x4);",
    expected: "true\ntrue\ntrue",
  },
  {
    section: "sec-gettypeobject",
    title: "One Type Record, one Type Object",
    summary: "Every mention of a structure in expression position yields the same interned object.",
    code: "const T = type [uint8, uint8];\nconsole.log(typeof T, T === type [uint8, uint8], T === type [uint16, uint16]);",
    expected: "'object' true false",
  },
  {
    section: "sec-subtyping-and-assignability",
    title: "A member is a subtype of its union",
    code: "type U = uint8 | string;\nconsole.log(Reflect.isAssignable(uint8, U), Reflect.isAssignable(U, uint8));",
    expected: "true false",
  },
  {
    section: "sec-issubtype",
    title: "A literal type sits under its base",
    summary: "type 3 is a subtype of number, its base - not of uint8; literals reach uint8 by propagation instead.",
    code: "console.log(Reflect.isAssignable(type 3, number), Reflect.isAssignable(type 3, uint8));",
    expected: "true false",
  },
  {
    section: "sec-isassignable",
    title: "Numeric types do not convert implicitly",
    summary: "A primitive type is assignable only to itself and any, so this is a checker error.",
    code: "let a: uint8 = 5;\nlet b: uint16 = a;",
    throws: true,
    expected: "",
  },
  {
    section: "sec-isassignable",
    title: "State the conversion",
    summary: "The program that wants a uint8 to become a uint16 says so.",
    code: "let a: uint8 = 5;\nlet b: uint16 = uint16(a);\nconsole.log(b, b instanceof uint16);",
    expected: "5 (typed) true",
  },
  {
    section: "sec-static-type-of-an-expression",
    title: "The position types the literal",
    summary: "5 written in a uint8 position is a uint8 value; 5 written bare is a number.",
    code: "let a: uint8 = 5;\nconsole.log(a instanceof uint8, 5 instanceof uint8);",
    expected: "true false",
  },
  {
    section: "sec-compile-time-evaluability",
    title: "A computed type",
    summary: "A type position admits a call; the checker evaluates it to a Type Object.",
    code: "function id(T) { return T; }\ntype Q = id(uint8);\nconsole.log(Q === uint8);",
    expected: "true",
  },
  {
    section: "sec-iscompiletimeevaluable",
    title: "The call runs at check time",
    summary: "Any compile-time-evaluable expression works, including branching on one.",
    code: "function choose(flag) { return flag ? uint8 : string; }\ntype C = choose(1 === 1);\nconsole.log(C === uint8);",
    expected: "true",
  },
  {
    section: "sec-evaluatebuildercall",
    title: "A builder constructs a type",
    summary: "Builders assemble Type Objects with Reflect.makeType, and the result interns like any other type - so a built tuple equals the one written directly.",
    code: 'function pairOf(T) {\n  return Reflect.makeType({ kind: "tuple", elements: [{ type: T, rest: false }, { type: T, rest: false }] });\n}\ntype P = pairOf(uint8);\nconsole.log(P === type [uint8, uint8]);',
    expected: "true",
  },
  {
    section: "sec-evaluation-budget",
    title: "Metered, not observable",
    summary:
      "Checker-run user code is metered by host-set step and record budgets; ordinary programs never notice - nested calls just work.",
    code: "function id(T) { return T; }\ntype N = id(id(id(uint16)));\nconsole.log(N === uint16);",
    expected: "true",
  },
  {
    section: "sec-evaluatetotypeobject",
    title: "Alias and inline spelling agree",
    summary: "The spec's own example: a named type and its expansion are one Type Object.",
    code: "type Point = { x: float32, y: float32 };\nconsole.log(Point === type { x: float32, y: float32 });",
    expected: "true",
  },
  {
    section: "sec-type-errors",
    title: "The checking pass runs first",
    summary: "A checker error is raised before any of the program runs - the log never happens.",
    code: 'console.log("never runs");\nlet x: uint8 = "hi";',
    throws: true,
    expected: "",
  },
];
