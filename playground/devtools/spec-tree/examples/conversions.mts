import type { ExampleChapter } from "./types.mts";

/**
 * Conversions (sec-conversions and children). The chapter's rule: a value of
 * one value type never implicitly becomes a value of another; every
 * conversion between two typed values is written in the source. All outputs
 * verified by scripts/validate-examples.mts against the built engine.
 */
export const conversions: ExampleChapter = [
  {
    section: "sec-conversions",
    title: "Conversions are written",
    summary: "Between typed values, the program states the conversion; Number() is the explicit door back to an untyped number.",
    code: 'let a: uint8 = 200;\nlet w: uint16 = uint16(a);\nconsole.log(w, Number(a), typeof Number(a), String(a));',
    expected: "200 (typed) 200 'number' '200'",
  },
  {
    section: "sec-the-conversion-rule",
    title: "The implicit cases are not conversions",
    summary: "A literal takes its position's type outright, and an any value is checked and converted at the boundary - neither converts one typed value to another.",
    code: "let a: uint8 = 5;\nlet boxed: any = 7;\nlet b: uint8 = boxed;\nconsole.log(a, b);",
    expected: "5 (typed) 7 (typed)",
  },
  {
    section: "sec-inferred-result-type",
    title: "The body types the result",
    summary: "With no declared return type, an arrow's result type is the static type of its body.",
    code: "const g = (x: uint8) => x;\nconsole.log(g(5) instanceof uint8);",
    expected: "true",
  },
  {
    section: "sec-contextual-types",
    title: "The position picks the overload",
    summary: "Bare, Math.sqrt is the float64 signature; in a uint8 position the context selects the integer one.",
    code: "console.log(Math.sqrt(10));\nconst a: uint8 = Math.sqrt(10);\nconsole.log(a);",
    expected: "3.1622776601683795\n3 (typed)",
  },
  {
    section: "sec-literal-propagation",
    title: "However the position spells its type",
    summary: "A literal takes the type its position requires, and a parameter is such a position - so an annotation naming an alias is refused before anything runs, exactly as the same type written inline is.",
    code: "type U = uint8;\nfunction f(p: U) { return p; }\nf(300);",
    throws: true,
    expected: "",
  },
  {
    section: "sec-literal-propagation",
    title: "A literal type accepts its one value",
    code: "type Level = 5;\nlet x: Level = 5;\nconsole.log(x, x instanceof Level);",
    expected: "5 true",
  },
  {
    section: "sec-literalvalueintype",
    title: "A literal that cannot fit is an early error",
    summary: "300 is not representable in uint8, so the checker refuses the program before it runs.",
    code: "let x: uint8 = 300;",
    throws: true,
    expected: "",
  },
  {
    section: "sec-explicit-conversion",
    title: "The conversion call",
    summary: "A numeric type used as a function converts; integer conversion wraps modulo 2^n.",
    code: "console.log(uint16(65535), uint8(300));",
    expected: "65535 (typed) 44 (typed)",
  },
  {
    section: "sec-convertvalue",
    title: "Conversion at the any boundary",
    summary: "A numeric value the target represents exactly converts when it crosses from any.",
    code: "let boxed: any = 2.5;\nlet f: float32 = boxed;\nconsole.log(f);",
    expected: "2.5 (typed)",
  },
  {
    section: "sec-numericconvert",
    title: "Integer conversion wraps",
    summary: "1024 into uint8 keeps the low bits: 1024 mod 256 is 0. The := cast is the inline conversion spelling.",
    code: "console.log(((1024 := uint16) := uint8));",
    expected: "0 (typed)",
  },
  {
    section: "sec-primitiveconvert",
    title: "A string's sources are those with a canonical text",
    summary: "The rule for `string` divides its sources by whether the source HAS a canonical text rather than by whether it is a primitive - a number, a BigInt and a Boolean each have exactly one text that denotes them, while undefined, null, an object and a Symbol have only a diagnostic one and are refused.",
    code: "function g() { return 5; }\nlet s: string = g();\nconsole.log(s);\nfunction h() { return {}; }\nlet t: string = h();",
    throws: true,
    expected: "'5'",
  },
  {
    section: "sec-primitiveconvert",
    title: "string() and boolean() convert",
    summary: "The ordinary primitives convert by ToString and ToBoolean when called as conversions.",
    code: "console.log(string(42), boolean(0), boolean(3));",
    expected: "'42' false true",
  },
  {
    section: "sec-user-defined-conversions",
    title: "A conversion operator",
    summary: "operator number() on the source class converts the receiver wherever a number is expected.",
    code: "class Celsius { deg = 20; operator number() { return this.deg; } }\nfunction warm(n: number) { return n + 1; }\nconsole.log(warm(new Celsius()));",
    expected: "21",
  },
  {
    section: "sec-user-defined-conversions",
    title: "A converting constructor",
    summary: "A one-parameter constructor converts its parameter type to the class, so a bare 3 becomes a Meters.",
    code: "class Meters { constructor(v: float32) { this.v = v; } }\nfunction len(m: Meters) { return m.v; }\nconsole.log(Number(len(3)));",
    expected: "3",
  },
  {
    section: "sec-literal-overload-ranking",
    title: "Literals rank, typed values select",
    summary: "The same Math.floor is the uint8 signature in a uint8 position and float64 bare.",
    code: "const a: uint8 = Math.floor(7);\nconsole.log(a);\nconsole.log(Math.floor(7.9));",
    expected: "7 (typed)\n7",
  },
  {
    section: "sec-existing-abstract-conversion-operations",
    title: "ToNumber needs the explicit spelling",
    summary: "Implicit ToNumber of a uint8 would be a forbidden conversion, so the program writes Number(a) to say it.",
    code: "let a: uint8 = 200;\nconsole.log(Number(a), typeof Number(a));",
    expected: "200 'number'",
  },
];
