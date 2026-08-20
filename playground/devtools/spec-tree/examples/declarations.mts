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
    summary: "The name works where a type is expected and evaluates to the type object in expression position.",
    code: "type Point = { x: float32, y: float32 };\nconst p: Point = { x: 1, y: 2 };\nconsole.log(Number(p.x), typeof Point);",
    expected: "1 'object'",
  },
  {
    section: "sec-type-alias-declarations",
    title: "An alias may name itself",
    summary: "A cycle is admitted where it passes through a position holding a reference - here the member written L | null, which is what makes a linked list expressible.",
    code: "type L = { value: uint8, next: L | null };\nconst n: L = { value: 1, next: { value: 2, next: null } };\nconsole.log(n.next.value);",
    expected: "2 (typed)",
  },
  {
    section: "sec-type-alias-declarations",
    title: "A cycle through other aliases",
    summary: "The rule is about the cycle, not about one declaration: two aliases may name each other.",
    code: "type A = { b: B | null };\ntype B = { a: A | null };\nconst v: A = { b: { a: null } };\nconsole.log(typeof A, v.b.a);",
    expected: "'object' null",
  },
  {
    section: "sec-typed-bindings",
    title: "Every declaration form, and every route to the store",
    summary: "The annotation governs the binding whichever form declares it - and a top-level `var` is a property of the global object, so the property carries the type and the two spellings of one store agree.",
    code: "var v: uint8 = 1;\nv = 2;\nconsole.log(v, v is uint8);\nlet a: any = 300;\nglobalThis.v = a;",
    throws: true,
    expected: "2 (typed) true",
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
    summary: "A dynamic array defaults to a new empty array of its type; boolean to false.",
    code: "let arr: [].<uint8>;\nlet b: boolean;\nconsole.log(arr, b, arr.length);",
    expected: "[] false 0 (typed)",
  },
  {
    section: "sec-defaultvalueof",
    title: "A tuple defaults element-wise",
    summary: "Each position takes its declared initial where it has one and its type's zero otherwise, so the binding holds a whole tuple before it is assigned.",
    code: "let t: [uint8, string];\nlet w: [uint8, uint8 = 5];\nconsole.log(t, w);",
    expected: "[0 (typed), ''] [0 (typed), 5 (typed)]",
  },
  {
    section: "sec-defaultvalueof",
    title: "A type with no zero must be initialized",
    summary: "The clause has a second half: where a type has no default, declaring a binding of it without an initializer is a type error, so the operation reports the absence rather than the binding holding a value of no type.",
    code: 'let ok: uint8 | null;\nconsole.log(ok);\nlet refused: uint8 | string;',
    // The refusal is an EARLY ERROR now, so the log above it never runs: the
    // whole source text is rejected rather than evaluated.
    throws: true,
    expected: "",
  },
  {
    section: "sec-defaultvalueof",
    title: "Every numeric family has a zero",
    summary: "The rule reads \"if t is a numeric type, return the value of t representing 0\", and the numeric types run wider than the integer widths - a decimal's zero is its shortest cohort member, and a vector's is its lane zero in every lane.",
    code: "let d: decimal128;\nlet v: float32x4;\nlet m: boolean8;\nlet q: rational;\nconsole.log(d.toString(), String(v.x), m.any(), q.toString());",
    expected: "'0' '0' false '0'",
  },
  {
    section: "sec-defaultvalueof",
    title: "A value type class is a shape with a zero",
    summary: "The rule reaches fields too: an instance comes into existence with every field at its type's default, tuples included.",
    code: "class C { n: uint8; t: [uint8, uint8]; }\nconst c = new C();\nconsole.log(c.n, c.t);",
    expected: "0 (typed) [0 (typed), 0 (typed)]",
  },
  {
    section: "sec-defaultvalueof",
    title: "A parameterization's zero is its base's zero, crossed",
    summary: "The step crosses rather than tests: a parameterization has whatever default its base's zero gets by crossing into it, so `let w: T;` and `let w: T = 0;` succeed together. The dimensions meta type here defines no validate, and the cast declared on float64 is what admits a bare zero - which is what keeps a unit type zero-fillable.",
    code: "type Dim = { m: number };\nmeta Dim { default = { m: 0 }; subtype(a, b) { return a.m === b.m; } }\ntype Meter = float64.<{ m: 1 }>;\nprimitive float64 { operator float64.<{ m: 1 }>(): float64.<{ m: 1 }> { return this; } }\nlet w: Meter;\nlet v: Meter = 10;\nclass Vector3 { x: Meter; y: Meter; z: Meter; }\nlet field: [3].<Vector3>;\nconsole.log(Number(w), Number(v), Number(field[2].z));",
    expected: "0 10 0",
  },
  {
    section: "sec-defaultvalueof",
    title: "A brand with no way in has no zero",
    summary: "The same rule read the other way. With no cast declared nothing crosses from an unconstrained value, so the parameterization has no default and its declaration needs an initializer - which is also how a class states that its zero-filled form is not meaningful, by holding a field of such a type.",
    code: "type Dim = { m: number };\nmeta Dim { default = { m: 0 }; subtype(a, b) { return a.m === b.m; } }\ntype Meter = float64.<{ m: 1 }>;\nconsole.log('declared');\nlet h: Meter;",
    throws: true,
    // Nothing prints: the declaration below is refused before the source text
    // runs, which is what an Early Error means.
    expected: "",
  },
  {
    section: "sec-defaultvalueof",
    title: "A cast is a way in, not a way past",
    summary: "Where a meta type defines validate the crossing still runs it, so a bound that refuses the base's zero leaves the parameterization without one even though a cast is declared, and an out-of-range initializer is refused at the same boundary.",
    code: "type Bnd = { lo: number };\nmeta Bnd { default = { lo: -Infinity }; subtype(a, b) { return a.lo >= b.lo; } validate(v, c) { return Number(v) >= c.lo; } }\nprimitive float64 { operator float64.<{ lo: 0 }>(): float64.<{ lo: 0 }> { return this; } }\nprimitive float64 { operator float64.<{ lo: 1 }>(): float64.<{ lo: 1 }> { return this; } }\nlet ok: float64.<{ lo: 0 }>;\nconsole.log(Number(ok));\nlet refused: float64.<{ lo: 1 }>;",
    throws: true,
    // As above - the log never runs, because the refusal is a check-time one.
    expected: "",
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
