import type { ExampleChapter } from "./types.mts";

/**
 * Composites (sec-composites and children) and Pattern Matching
 * (sec-pattern-matching and children). All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const compositesAndMatching: ExampleChapter = [
  {
    section: "sec-composites",
    title: "Contents are identity",
    summary: "Two composites built from the same contents are the same object, whatever order they were written in.",
    code: "console.log(Composite({ x: 1, y: 4 }) === Composite({ y: 4, x: 1 }), Composite({ x: 1 }) === Composite({ x: 2 }));",
    expected: "true false",
  },
  {
    section: "sec-composite-objects",
    title: "Frozen, null-prototype, sorted keys",
    code: 'const c = Composite({ y: 1, x: 2, 2: 3, 1: 4 });\nconsole.log(Object.isFrozen(c), Object.getPrototypeOf(c), Object.keys(c).join(","));',
    expected: "true null '1,2,x,y'",
  },
  {
    section: "sec-composite-objects",
    title: "A composite tuple is an Array",
    code: "const t = Composite([1, 2, 3]);\nconsole.log(t.length, t[0], Array.isArray(t), Composite([1, 2]) === Composite([2, 1]));",
    expected: "3 1 true false",
  },
  {
    section: "sec-composite-types",
    title: "The element types are part of it",
    summary: "Composite.<T> creates at the type, so its elements are typed and it is a different composite from the untyped one.",
    code: "type T = [uint8, uint8];\nconsole.log(Reflect.typeOf(Composite.<T>([1, 2])[0]) === uint8, Composite.<T>([1, 2]) === Composite([uint8(1), uint8(2)]), Composite.<T>([1, 2]) === Composite([1, 2]));",
    expected: "true true false",
  },
  {
    section: "sec-composite-registry",
    title: "One entry per contents",
    summary: "The registry is what makes Set and Map treat equal composites as one key.",
    code: 'console.log(new Set([Composite({ x: 1 }), Composite({ x: 1 })]).size);\nconst m = new Map([[Composite({ x: 1, y: 4 }), "ship"]]);\nconsole.log(m.get(Composite({ y: 4, x: 1 })));',
    expected: "1\n'ship'",
  },
  {
    section: "sec-composite-abstract-operations",
    title: "Objects inside compare by identity",
    summary: "Interning is by contents, and a plain object's contents are its identity - so two fresh objects differ and one shared object matches.",
    code: "console.log(Composite({ v: {} }) === Composite({ v: {} }));\nconst o = {};\nconsole.log(Composite({ v: o }) === Composite({ v: o }));",
    expected: "false\ntrue",
  },
  {
    section: "sec-composite-function",
    title: "The function and its predicate",
    code: "console.log(Composite.isComposite(Composite({ x: 1 })), Composite.isComposite({}), Composite({ x: 1 }) instanceof Composite);",
    expected: "true false true",
  },
  {
    section: "sec-composite-json",
    title: "Composites serialize as their shape",
    code: "console.log(JSON.stringify(Composite({ x: 1 })), JSON.stringify(Composite([1, 2])));",
    expected: "'{\\\"x\\\":1}' '[1,2]'",
  },
  {
    section: "sec-composite-modifications",
    title: "Frozen means writes do nothing",
    summary: "The store is refused as on any frozen object; the composite is unchanged.",
    code: "const c = Composite({ x: 1 });\nc.x = 2;\nconsole.log(c.x);",
    expected: "1",
  },
  {
    section: "sec-composite-deviations",
    title: "A record and a tuple never coincide",
    summary: "The upstream proposal's two forms stay distinct here: same contents, different family, different object.",
    code: "console.log(Composite([1]) === Composite({ 0: 1 }), Array.isArray(Composite([1])), Array.isArray(Composite({ 0: 1 })));",
    expected: "false true false",
  },
  {
    section: "sec-pattern-matching",
    title: "match picks the first arm",
    code: 'console.log(match (2) { when 1: "one"; when 2: "two"; default: "other"; });',
    expected: "'two'",
  },
  {
    section: "sec-match-expression",
    title: "Ranges and guards as arms",
    code: 'console.log(match (5) { when 1..<3: "low"; when 4..<6: "mid"; default: "high"; });\nconsole.log(match (5) { when let x if (x > 3): "big"; default: "small"; });',
    expected: "'mid'\n'big'",
  },
  {
    section: "sec-match-patterns",
    title: "Structural patterns destructure",
    code: "console.log(match ({ a: 7 }) { when { a: let v }: v; default: 0; });\nconsole.log(match ([1, 9]) { when [1, let b]: b; default: 0; });",
    expected: "7\n9",
  },
  {
    section: "sec-match-patterns",
    title: "A binding may require a type",
    summary: "when let x: uint8 matches only a value of that type - an untyped 5 falls through.",
    code: 'console.log(match (uint8(5)) { when let x: uint8: "typed"; default: "no"; });\nconsole.log(match (5) { when let x: uint8: "typed"; default: "no"; });',
    expected: "'typed'\n'no'",
  },
  {
    section: "sec-pattern-static-semantics",
    title: "A match over a closed type needs no default",
    summary: "The arms cover every member of the enum, so the match is checked complete.",
    code: 'enum Color { Red, Green }\nfunction name(c: Color) { return match (c) { when Color.Red: "red"; when Color.Green: "green"; }; }\nconsole.log(name(Color.Red), name(Color.Green));',
    expected: "'red' 'green'",
  },
  {
    section: "sec-pattern-static-semantics",
    title: "Arms narrow the subject",
    summary: "Each arm's binding carries its matched type, so the string arm may take .length and the uint8 arm may do typed arithmetic.",
    code: 'let v: uint8 | string = "hi";\nconst r = match (v) { when let s: string: s.length; when let n: uint8: n + (1 := uint8); };\nconsole.log(r);',
    expected: "2",
  },
  {
    section: "sec-is-pattern",
    title: "is takes a pattern too",
    summary: "The binding form answers a boolean and binds in the branch it guards.",
    code: "console.log(uint8(1) is let x: uint8, 1 is let x: uint8, typeof (1 is 1));\nconst val = 5;\nlet out = \"X\";\nif (val is let x) { out = String(x); }\nconsole.log(out);",
    expected: "true false 'boolean'\n'5'",
  },
  {
    section: "sec-custommatcher-symbol",
    title: "An extractor pattern",
    summary: "The matcher returns the values the pattern binds, so Some(let inner) destructures through it.",
    code: "const Some = { [Symbol.customMatcher](v) { return [v]; } };\nconsole.log(match (7) { when Some(let inner): inner; default: 0; });",
    expected: "7",
  },
];
