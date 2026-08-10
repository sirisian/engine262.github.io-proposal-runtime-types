import type { ExampleChapter } from "./types.mts";

/**
 * Arrays and Tuples (sec-arrays) and Extensions (sec-extensions), the last
 * two chapters of the main clause. All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const arraysAndExtensions: ExampleChapter = [
  {
    section: "sec-arrays",
    title: "A typed array's elements are typed",
    summary: "The length is a uint32 and every element is of the element type, arithmetic included.",
    code: "let a: [].<uint8> = [1, 2, 3];\nconsole.log(a.length, a[0] is uint8, a[0] + (1 := uint8));",
    expected: "3 (typed) true 2 (typed)",
  },
  {
    section: "sec-array-membership",
    title: "Element types are invariant, except any",
    summary: "A uint8 array is a [].<any> but not a [].<number> - the second line would be refused.",
    code: "let a: [].<uint8> = [1, 2, 3];\nconst c: [].<any> = a;\nconsole.log(c.length);",
    expected: "3 (typed)",
  },
  {
    section: "sec-array-membership",
    title: "A tuple's arity is part of membership",
    code: "const t: [uint8, string] = [1];",
    throws: true,
    expected: "",
  },
  {
    section: "sec-array-defaults-and-stores",
    title: "An element default fills the gap",
    summary: "The tuple type declares an initial value, so the empty literal still produces a full tuple.",
    code: "const a: [uint8 = 5] = [];\nconsole.log(a[0]);",
    expected: "5 (typed)",
  },
  {
    section: "sec-array-defaults-and-stores",
    title: "Stores are checked",
    summary: "An any value stored to a typed element runs the boundary check at the store.",
    code: "let b: [].<uint8> = [1];\nlet boxed: any = 300;\nb[0] = boxed;",
    throws: true,
    expected: "",
  },
  {
    section: "sec-extensions",
    title: "Extension types are ordinary types",
    summary: "SIMD vectors come from an extension, yet lanes, swizzles, and typed values work like everything else here.",
    code: "const v = float32x4(1, 2, 3, 4);\nconsole.log(v.x, Number(v.lane.<3>()));",
    expected: "1 (typed) 4",
  },
  {
    section: "sec-extension-mechanism",
    title: "Extensions add library functions",
    summary: "An added function is overloaded and checked by the same rules as the built-ins.",
    code: "console.log(typeof Math.sumPrecise, Math.sumPrecise([1, 2, 3]));",
    expected: "'function' 6",
  },
  {
    section: "sec-extension-hooks",
    title: "A hook in use",
    summary: "shared is the threading extension's modifier, one of the obligations the hooks table names.",
    code: "let s: shared uint8 = 1;\nconsole.log(s);",
    expected: "1 (typed)",
  },
  {
    section: "sec-coverage-of-the-design-documents",
    title: "The corpus runs",
    summary: "The design's examples directory is a checked corpus; this is one of its type-challenge entries, live.",
    code: "function returnType(F) { return Reflect.getReflection(F).signatures[0].return.type; }\ntype F = () => string;\nconsole.log(returnType(F) === string);",
    expected: "true",
  },
];
