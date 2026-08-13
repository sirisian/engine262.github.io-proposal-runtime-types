import type { ExampleChapter } from "./types.mts";

/**
 * References and Borrowing (sec-references-and-borrowing and children) and
 * Typed Regular Expressions (sec-typed-regular-expressions). All outputs
 * verified by scripts/validate-examples.mts against the built engine.
 */
export const referencesAndRegexes: ExampleChapter = [
  {
    section: "sec-references-and-borrowing",
    title: "A ref parameter writes back",
    summary: "The write lands in the caller's binding, and a bare literal takes the type the position requires - the ref writes through to the binding, so the binding's own annotation is what the value crosses.",
    code: "function f(ref x: uint8) { x = 2; }\nlet v: uint8 = 1;\nf(ref v);\nconsole.log(v, v instanceof uint8);",
    expected: "2 (typed) true",
  },
  {
    section: "sec-reference-syntax",
    title: "Variables, properties, and elements borrow",
    code: "const o = { a: 0 };\nfunction bump(ref a) { a++; }\nbump(ref o.a);\nlet arr = [41];\nbump(ref arr[0]);\nconsole.log(o.a, arr[0]);",
    expected: "1 42",
  },
  {
    section: "sec-typed-destructuring",
    title: "Annotated destructuring members",
    summary: "The parenthesized member takes an annotation, optionality, and a rest.",
    code: "let { (x?: uint8) } = { x: 1 };\nconsole.log(x);\nlet { (a: uint8), ...rest: object } = { a: 1, z: 2 };\nconsole.log(rest.z);",
    expected: "1 (typed)\n2",
  },
  {
    section: "sec-reference-values",
    title: "A reference decays to its value",
    summary: "Outside a ref position, the callee receives the value: x is untouched and the copy changed.",
    code: "let x = 1;\nfunction id(v) { v = 9; return v; }\nlet r = id(ref x);\nconsole.log(x, r);",
    expected: "1 9",
  },
  {
    section: "sec-reference-parameters-and-arguments",
    title: "A ref parameter needs a ref argument",
    code: "function f(ref a) { a++; }\nf(5);",
    throws: true,
    expected: "",
  },
  {
    section: "sec-requireborrowablereference",
    title: "The borrowed location must match the type",
    summary: "An untyped number is not an int32 location, so the borrow is refused.",
    code: "function f(ref a: int32) { a++; }\nlet a = 5;\nf(ref a);",
    throws: true,
    expected: "",
  },
  {
    section: "sec-reference-bindings",
    title: "A ref binding aliases, and rebinds",
    summary: "Writes flow both ways through the alias; ref b = retargets the binding itself.",
    code: "let a = [5, 6];\nlet ref b = a[0];\nb = 10;\nconsole.log(a[0]);\na[0] = 42;\nconsole.log(b);\nref b = a[1];\nb = 99;\nconsole.log(a[0], a[1]);",
    expected: "10\n42\n42 99",
  },
  {
    section: "sec-reference-iteration",
    title: "for-ref-of writes in place",
    code: "let a: [].<uint8> = [1, 2, 3];\nfor (let ref e of a) { e = e * (2 := uint8); }\nconsole.log(a[0], a[2]);",
    expected: "2 (typed) 6 (typed)",
  },
  {
    section: "sec-location-consuming-contexts",
    title: "A returned reference reaches ++ and =",
    summary: "In the three location-consuming positions a call's reference does not decay - the update and the assignment write through.",
    code: "function first(a) { return ref a[0]; }\nlet arr = [7, 8];\nfirst(arr)++;\nconsole.log(arr[0]);\nfirst(arr) = 20;\nconsole.log(arr[0]);",
    expected: "8\n20",
  },
  {
    section: "sec-soa-references",
    title: "A borrow into a column store",
    summary: "The element has no single address; the reference is the columns plus the index, and writes land in them.",
    code: "class P { x: uint8; }\nconst s = new SoA.<P>();\ns.push({ x: 1 });\nlet ref e = s[0];\ne.x = (5 := uint8);\nconsole.log(s[0].x);",
    expected: "5 (typed)",
  },
  {
    section: "sec-reference-liveness",
    title: "The loop rule",
    summary: "Resizing the array while a reference into it is live is refused at the operation.",
    code: "let a = [1, 2];\nfor (let ref e of a) { a.push(9); }",
    throws: true,
    expected: "",
  },
  {
    section: "sec-typed-regular-expressions",
    title: "The literal types its groups",
    summary: "The annotation states one required and one optional group, and the checker verifies the literal matches it.",
    code: 'let r: RegExp.<[string, string | undefined], {}> = /(\\d+)(\\.\\d+)?/;\nconst m = r.exec("v3.5");\nconsole.log(m[1], m[2]);',
    expected: "'3' '.5'",
  },
];
