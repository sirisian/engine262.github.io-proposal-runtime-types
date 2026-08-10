import type { ExampleChapter } from "./types.mts";

/**
 * The remaining chapters: sec-divergence, iteration and generator types,
 * do-expressions, the pipeline operator, types across agents, and typed JSON
 * parsing. All outputs verified by scripts/validate-examples.mts.
 */
export const expressionsAndJson: ExampleChapter = [
  {
    section: "sec-divergence",
    title: "Where a typed program differs",
    summary: "The visible divergences from today's semantics, in one place: a typed value is a number to typeof, equal to a matching literal, and unequal to an untyped variable of the same value.",
    code: "let n = 5;\nconsole.log(typeof (5 := uint8), (5 := uint8) === 5, (5 := uint8) === n, Number(5 := uint8) === 5);",
    expected: "'number' true false true",
  },
  {
    section: "sec-iteration-types",
    title: "Iterable is a parameterized type",
    code: "console.log(typeof Iterable, Iterable.<uint8> === Iterable.<uint8>, Iterable.<uint8> === Iterable.<uint16>);",
    expected: "'object' true false",
  },
  {
    section: "sec-generator-types",
    title: "A generator's yield type",
    summary: "The annotation types what the generator yields, and spreading it collects those values.",
    code: "function* f(): uint8 { yield 1; yield 2; }\nconsole.log([...f()]);",
    expected: "[1, 2]",
  },
  {
    section: "sec-do-expressions",
    title: "A block with a value",
    summary: "The do expression evaluates to its completion value, so a sequence answers its last statement.",
    code: "console.log(do { 1; 2 }, do { let t = 3; t * 2 });",
    expected: "2 6",
  },
  {
    section: "sec-do-expression-early-errors",
    title: "An empty do has no value",
    code: "console.log(do { }, do { ; });",
    expected: "undefined undefined",
  },
  {
    section: "sec-completiontypeof",
    title: "Every branch contributes",
    summary: "The type of the whole is taken over the completion values its branches can produce.",
    code: "console.log(do { if (true) 1; else 2 }, do { if (false) 1; else 2 });\nconsole.log(do { switch (1) { case 1: 5; break; default: 6; } });",
    expected: "1 2\n5",
  },
  {
    section: "sec-do-expression-contextual-type",
    title: "The position types the result",
    summary: "In a uint8 binding the do expression's value is a uint8, exactly as a literal there would be.",
    code: "const a: uint8 = do { 5 };\nconsole.log(a, a instanceof uint8);",
    expected: "5 (typed) true",
  },
  {
    section: "sec-do-generator-expressions",
    title: "do * is a generator expression",
    code: "console.log([...do * { yield 1; yield 2; }]);",
    expected: "[1, 2]",
  },
  {
    section: "sec-do-expression-modifications",
    title: "do-while is untouched",
    summary: "The existing statement keeps its meaning; only do followed by a block is the new expression.",
    code: "let i = 0;\ndo { i += 1; } while (i < 3);\nconsole.log(i);",
    expected: "3",
  },
  {
    section: "sec-pipeline-operator",
    title: "The topic reference",
    code: "console.log(5 |> % + 1, [1, 2, 3] |> %.length);",
    expected: "6 3",
  },
  {
    section: "sec-pipeline-early-errors",
    title: "The topic may appear more than once",
    summary: "It is a binding, not a substitution, so repeating it does not repeat the work that produced it.",
    code: 'console.log((5 |> [%, %]).join(","));',
    expected: "'5,5'",
  },
  {
    section: "sec-pipeline-runtime-semantics",
    title: "Chaining",
    code: "function f(x) { return x * 2; }\nfunction g(x) { return x + 1; }\nconsole.log(5 |> f(%) |> g(%));",
    expected: "11",
  },
  {
    section: "sec-pipeline-static-semantics",
    title: "The topic is a typed binding",
    summary: "It carries the static type of its left operand, so a test on it narrows as a test on any binding does.",
    code: 'let v: uint8 | string = (5 := uint8);\nconsole.log(v |> (% is uint8 ? "num" : "str"));',
    expected: "'num'",
  },
  {
    section: "sec-pipeline-modifications",
    title: "Pipelines nest inside arguments",
    summary: "An inner pipeline has its own topic, and the outer one is unaffected.",
    code: "function f(a, b) { return a + b; }\nconsole.log(1 |> f(%, 2 |> % * 10));",
    expected: "21",
  },
  {
    section: "sec-types-across-agents",
    title: "Type identity is per-agent",
    summary: "Interning is per-agent, so a type crossing a boundary is re-interned on the other side rather than carried as an object.",
    code: "type A = { x: uint8 };\ntype B = { x: uint8 };\nconsole.log(A === B, typeof A);",
    expected: "true 'object'",
  },
  {
    section: "sec-typed-json-parsing",
    title: "Parsing to a type",
    summary: "JSON.parse.<T> checks and converts as it builds, so the property arrives typed rather than needing a pass afterwards.",
    code: "let o = JSON.parse.<{ a: uint8 }>('{\"a\":5}');\nconsole.log(o.a, o.a === (5 := uint8));",
    expected: "5 (typed) true",
  },
  {
    section: "sec-coercejsonvalue",
    title: "Parsing straight to a composite",
    summary: "With a composite type argument the result is interned, so it equals one built by hand.",
    code: "interface I { x: uint8 }\nconsole.log(Composite.isComposite(JSON.parse.<Composite.<I>>('{\"x\":1}')));",
    expected: "true",
  },
];
