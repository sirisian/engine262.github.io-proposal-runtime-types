import type { ExampleChapter } from "./types.mts";

/**
 * Declarations (sec-declarations and children): typed bindings, defaults,
 * typed initializers, aliases, and narrowing. All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const declarations: ExampleChapter = [
  {
    section: "sec-declarations",
    title: "Annotated bindings",
    code: 'let n: uint8 = 7;\nconst s: string = "ok";\nconsole.log(n, s);',
    expected: "7 (typed) 'ok'",
  },
  {
    section: "sec-type-alias-declarations",
    title: "An alias in both positions",
    summary: "The name works where a type is expected and evaluates to the type object in expression position (see KNOWN-DIVERGENCES.md D1 for the recursive form).",
    code: "type Point = { x: float32, y: float32 };\nconst p: Point = { x: 1, y: 2 };\nconsole.log(Number(p.x), typeof Point);",
    expected: "1 'object'",
  },
  {
    section: "sec-typed-bindings",
    title: "Every assignment is checked",
    summary: "The annotation governs the binding for its whole life - the bad assignment is refused before anything runs.",
    code: 'let a: uint8 = 5;\na = 7;\nconsole.log(a);\na = "x";',
    throws: true,
    expected: "",
  },
  {
    section: "sec-default-values",
    title: "What a binding holds before assignment",
    summary: "Numerics default to their zero, string to empty, and a union containing null to null.",
    code: "let d: uint8;\nlet s: string;\nlet u: uint8 | null;\nconsole.log(d, s, u);",
    expected: "0 (typed) '' null",
  },
  {
    section: "sec-defaultvalueof",
    title: "Structured defaults",
    summary: "A dynamic array defaults to a new empty array of its type; boolean to false (see KNOWN-DIVERGENCES.md D4 for the tuple case).",
    code: "let arr: [].<uint8>;\nlet b: boolean;\nconsole.log(arr, b, arr.length);",
    expected: "[] false 0 (typed)",
  },
  {
    section: "sec-typed-initializers-semantics",
    title: "Inference with :=",
    summary: "A := declaration infers the widened type of its initializer - a number, not the literal 5.",
    code: "let x := 5;\nx = 6;\nconsole.log(x);",
    expected: "6",
  },
  {
    section: "sec-typed-initializers-semantics",
    title: "The inferred type still binds",
    summary: "s inferred string, so a number is refused - by the checker, before the program runs.",
    code: 'let s := "a";\ns = 5;',
    throws: true,
    expected: "",
  },
  {
    section: "sec-narrowing",
    title: "A test refines the branch it guards",
    code: 'let v: uint8 | string = "hello";\nif (v instanceof string) { console.log("length", v.length); }',
    expected: "'length' 5",
  },
  {
    section: "sec-narrowing",
    title: "A test that cannot vary is refused",
    summary: "a is a uint8, so instanceof string can never succeed; the checker rejects the dead branch.",
    code: 'let a: uint8 = 5;\nif (a instanceof string) { console.log("impossible"); }',
    throws: true,
    expected: "",
  },
  {
    section: "sec-canonical-total-order",
    title: "One member order, every spelling",
    summary: "Reflection sees the canonical order, so two spellings of one union reflect identically.",
    code: "type U1 = string | uint8;\ntype U2 = uint8 | string;\nconst a1 = Reflect.getReflection(U1).arms;\nconst a2 = Reflect.getReflection(U2).arms;\nconsole.log(a1.length, a1[0] === a2[0], a1[1] === a2[1], a1.includes(uint8));",
    expected: "2 true true true",
  },
  {
    section: "sec-narrowto",
    title: "Narrowed to the member",
    summary: "Inside the guarded branch v is a uint8, so arithmetic stays typed.",
    code: "let v: uint8 | string = (5 := uint8);\nif (v instanceof uint8) { console.log(v + 1); } else { console.log(v.length); }",
    expected: "6 (typed)",
  },
  {
    section: "sec-narrowfrom",
    title: "The else branch removes the member",
    summary: "Failing the uint8 test leaves string, so .length is well-typed in the else.",
    code: 'let v: uint8 | string = "hi";\nif (v instanceof uint8) { console.log("number"); } else { console.log("chars:", v.length); }',
    expected: "'chars:' 2",
  },
];
