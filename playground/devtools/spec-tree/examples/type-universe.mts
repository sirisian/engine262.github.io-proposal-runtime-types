import type { ExampleChapter } from "./types.mts";

/**
 * The Type Universe (sec-type-universe and children): every family of value
 * types, the special types, vectors, and names. All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const typeUniverse: ExampleChapter = [
  {
    section: "sec-type-universe",
    title: "The families are present",
    code: "console.log(typeof uint8, typeof float128, typeof decimal128, typeof int16x8);",
    expected: "'object' 'object' 'object' 'object'",
  },
  {
    section: "sec-value-types",
    title: "Identity is the value",
    summary: "Two typed 5s are one value; two equal decimals are the same by Object.is.",
    code: 'console.log((5 := uint8) === (5 := uint8), Object.is(decimal128("2.5"), decimal128("2.5")));',
    expected: "true true",
  },
  {
    section: "sec-integer-types",
    title: "Any width you name",
    summary: "int.<24> is an ordinary integer type; 8388607 is its maximum.",
    code: "type A = int.<24>;\ntype B = int.<24>;\nconsole.log(A === B);\nlet x: A = 8388607;\nconsole.log(x);",
    expected: "true\n8388607 (typed)",
  },
  {
    section: "sec-binary-floating-point-types",
    title: "The widest binary float holds what the narrower ones round away",
    summary: "Every binary64 value is exactly a binary128 value, so a double crossing into float128 keeps every bit - and printing it shows the value the double actually is, rather than the shortest text that reads back as it.",
    code: "let d: float64 = 0.1;\nconsole.log(d);\nlet w: float128 = 0.1;\nconsole.log(w.toString());",
    expected: "0.1 (typed)\n'0.1000000000000000055511151231257827021181583404541015625'",
  },
  {
    section: "sec-binary-floating-point-types",
    title: "A literal rounds to its position",
    summary: "float16 cannot hold pi's digits; the literal takes the nearest representable value.",
    code: "let h: float16 = 1.5;\nconsole.log(h);\nlet p: float16 = 3.14159;\nconsole.log(p);",
    expected: "1.5 (typed)\n3.140625 (typed)",
  },
  {
    section: "sec-decimal-floating-point-types",
    title: "Precision is remembered",
    summary: "1.50 keeps its trailing zero; equal cohort members are === but Object.is tells them apart.",
    code: 'let a: decimal128 = 1.50;\nconsole.log(a.toString(), decimal128("1.0") === decimal128("1.00"), Object.is(decimal128("1.0"), decimal128("1.00")));',
    expected: "'1.50' true false",
  },
  {
    section: "sec-rational-types",
    title: "Exact thirds",
    summary: "Rationals normalize and stay exact: a third three times is one.",
    code: "const third = rational(1, 3);\nconsole.log((third + third + third).toString(), rational(2, 4).toString());",
    expected: "'1' '1/2'",
  },
  {
    section: "sec-complex-types",
    title: "A complex value is an ordered pair",
    summary: "The values are the ordered pairs of a real and an imaginary part. An imaginary literal supplies the imaginary one and zero as the real, and the text reads back as the literal reads.",
    code: 'const z = 3i;\nconst w = complex(3, -4);\nconsole.log(z.real, z.imaginary, w.toString());',
    expected: "0 3 '3-4i'"
  },
  {
    section: "sec-vector-types",
    title: "A vector of lanes",
    code: "const v = float32x4(1, 2, 3, 4);\nconsole.log(Number(v[2]), Number(v.sum()));",
    expected: "3 10",
  },
  {
    section: "sec-vector-lanes",
    title: "Reading and replacing a lane",
    code: "const v = float32x4(1, 2, 3, 4);\nconsole.log(Number(v.lane.<1>()), Number(v.withLane.<0>(9).x));",
    expected: "2 9",
  },
  {
    section: "sec-vector-permutation",
    title: "Swizzles are permutations",
    summary: "xyxy rearranges the lanes; .z of the result is the original x.",
    code: "console.log(Number(float32x4(1, 2, 3, 4).xyxy.z));",
    expected: "1",
  },
  {
    section: "sec-vector-component-accessors",
    title: "One argument broadcasts",
    code: "const v = float32x4(7);\nconsole.log(Number(v.x), Number(v.w));",
    expected: "7 7",
  },
  {
    section: "sec-vector-lane-wise-math",
    title: "Operators run per lane",
    code: "const s = int32x4(1, 2, 3, 4) + int32x4(10, 10, 10, 10);\nconsole.log(Number(s.x), Number(s.w));",
    expected: "11 14",
  },
  {
    section: "sec-vector-masks",
    title: "Comparison makes a mask",
    summary: "Lane-wise < answers per lane; any and all summarize the mask.",
    code: "const m: boolean32x4 = float32x4(1, 2, 3, 4) < float32x4(4, 3, 2, 1);\nconsole.log(m.any(), m.all());",
    expected: "true false",
  },
  {
    section: "sec-vector-widths",
    title: "Widths across families",
    summary: "The lane count and lane width vary together; a single boolean1 widens into a boolean8 mask.",
    code: "console.log(typeof int16x8, typeof int8x16, typeof float64x2);\nconst b: boolean8 = (1 := boolean1);\nconsole.log(b.all(), b.any());",
    expected: "'object' 'object' 'object'\nfalse true",
  },
  {
    section: "sec-vector-wrapping",
    title: "Integer lanes wrap",
    code: "const w = int32x4(2147483647, 0, 0, 0) + int32x4(1, 0, 0, 0);\nconsole.log(Number(w.x));",
    expected: "-2147483648",
  },
  {
    section: "sec-any-type",
    title: "any is the untyped world",
    summary: "It accepts everything and is accepted everywhere, checked at the boundary.",
    code: 'let a: any = 5;\na = "now a string";\nconsole.log(a, Reflect.isAssignable(any, uint8), Reflect.isAssignable(uint8, any));',
    expected: "'now a string' true true",
  },
  {
    section: "sec-void-type",
    title: "The absence of a value",
    code: 'function log(): void { console.log("side effect"); }\nconsole.log(typeof log());',
    expected: "'side effect'\n'undefined'",
  },
  {
    section: "sec-null-and-undefined-types",
    title: "null and undefined are types",
    summary: "The union with null defaults to null, and undefined is a different type.",
    code: "type N = uint8 | null;\nlet x: N;\nconsole.log(x, null is N, undefined is N);",
    expected: "null true false",
  },
  {
    section: "sec-never-type",
    title: "never admits nothing",
    code: "let n: never = 5;",
    throws: true,
    expected: "",
  },
  {
    section: "sec-literal-types",
    title: "A type with one value",
    code: 'type One = 1;\ntype Yes = "yes";\nconsole.log(1 is One, "yes" is Yes, "no" is Yes);',
    expected: "true true false",
  },
  {
    section: "sec-parameterized-types",
    title: "Metadata refines a base",
    summary: "With the meta protocol declared, float64.<{ m: 1 }> is a distinct refinement of float64.",
    code: "type M = { m: number };\nmeta M { default = { m: 0 }; subtype(a, b) { return true; } }\ntype Tagged = float64.<{ m: 1 }>;\nconsole.log(typeof Tagged, Tagged === float64);",
    expected: "'object' false",
  },
  {
    section: "sec-the-type-type",
    title: "Types have a type",
    summary: "type is itself a value of the type type; a plain 5 is not.",
    code: "let t: type = uint8;\nconsole.log(t is type, (type) is type, 5 is type);",
    expected: "true true false",
  },
  {
    section: "sec-existing-language-types",
    title: "number is not float64",
    summary: "The existing types keep their identities; number and float64 are distinct even with one representation.",
    code: "console.log(Reflect.typeOf(5) === number, number === float64, Reflect.typeOf(5n) === bigint);",
    expected: "true false true",
  },
  {
    section: "sec-numeric-types-of-this-proposal",
    title: "Every family, one spelling",
    summary: "Typed values of each family print as themselves (int64 beyond 2^53 is currently double-backed: KNOWN-DIVERGENCES.md D9).",
    code: "console.log((65535 := uint16), (127 := int8), (1.5 := float32));",
    expected: "65535 (typed) 127 (typed) 1.5 (typed)",
  },
  {
    section: "sec-type-names",
    title: "Names are not reserved",
    summary: "A binding may shadow a type name; the canonical names like uint.<8> appear in error messages.",
    code: "let float128 = 5;\nconsole.log(float128);",
    expected: "5",
  },
];
