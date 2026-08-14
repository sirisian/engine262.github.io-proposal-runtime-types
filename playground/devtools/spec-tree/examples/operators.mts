import type { ExampleChapter } from "./types.mts";

/**
 * Operators (sec-operators and children): dispatch on typed operands, the
 * never-promotes rule, per-family operations, wrapping integer arithmetic,
 * typed equality, and user-defined operators. All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const operators: ExampleChapter = [
  {
    section: "sec-operators",
    title: "Typed arithmetic stays typed",
    code: "let a: uint8 = 5;\nlet b: uint8 = 3;\nconsole.log(a + b, Reflect.typeOf(a + b) === uint8);",
    expected: "8 (typed) true",
  },
  {
    section: "sec-operator-dispatch",
    title: "The operand arrives as itself",
    summary: "Through ToNumber this would be 300; dispatching on uint8 wraps to 44, proving no Number detour happened.",
    code: "console.log((200 := uint8) + (100 := uint8));",
    expected: "44 (typed)",
  },
  {
    section: "sec-tonumeric-revised",
    title: "ToNumeric preserves the type",
    summary: "The typed sum is a uint8; spell the conversion with Number() and the sum is a number.",
    code: "let a: uint8 = 5;\nconsole.log(Reflect.typeOf(a + a) === uint8, Reflect.typeOf(Number(a) + Number(a)) === number);",
    expected: "true true",
  },
  {
    section: "sec-arithmetic-never-promotes",
    title: "Different value types do not mix",
    summary: "Neither operand is assignable to the other, so the program states a conversion or is refused.",
    code: "let a: uint8 = 1;\nlet b: uint16 = 1;\na + b;",
    throws: true,
    expected: "",
  },
  {
    section: "sec-arithmetic-never-promotes",
    title: "A literal takes the other side's type",
    summary: "A literal has no type of its own, so it never forces a conversion - on either side.",
    code: "console.log((5 := uint8) + 3, Reflect.typeOf(3 + (5 := uint8)) === uint8);",
    expected: "8 (typed) true",
  },
  {
    section: "sec-which-operations-each-family-defines",
    title: "The complex family computes, and refuses what it does not define",
    summary: "Multiply, divide and the rest are defined over the pair; lessThan is not, since the complex numbers are not ordered. The arithmetic is C99 Annex G's, which is what an engine backed by a hardware complex type implements.",
    code: "const a = complex(3, 4), b = complex(1, 2);\nconsole.log((a * b).toString(), (a / b).toString());\nconsole.log(Math.abs(a), Math.conj(a).toString());\na < b;",
    throws: true,
    expected: "'-5+10i' '2.2-0.4i'\n5 '3-4i'",
  },
  {
    section: "sec-which-operations-each-family-defines",
    title: "Families define different operations",
    summary: "Bitwise operations belong to the integer family; a float operand is refused.",
    code: "let f: float32 = 1.5;\nf & f;",
    throws: true,
    expected: "",
  },
  {
    section: "sec-operator-results",
    title: "Comparisons yield plain booleans",
    code: "console.log((3 := uint8) < (5 := uint8), typeof ((3 := uint8) < (5 := uint8)));",
    expected: "true 'boolean'",
  },
  {
    section: "sec-integer-operations",
    title: "A shift counts in the type's own bits",
    summary: "Each type has its family's operations at ITS width, so a shift on a 40-bit type moves 40 bits - not the 32 the untyped operator would - and a distance is taken modulo the width.",
    code: "console.log((1 := uint.<40>) << (39 := uint.<40>));\nconsole.log((1099511627775 := uint.<40>) >>> (36 := uint.<40>));\nconsole.log((1 := uint.<33>) << (32 := uint.<33>));",
    expected: "549755813888 (typed)\n15 (typed)\n4294967296 (typed)",
  },
  {
    section: "sec-integer-operations",
    title: "Integer arithmetic wraps",
    summary: "Overflow, underflow, and signed overflow all wrap modulo 2^n - no promotion, no error.",
    code: "console.log((255 := uint8) + (1 := uint8), (0 := uint8) - (1 := uint8), (127 := int8) + (1 := int8));",
    expected: "0 (typed) 255 (typed) -128 (typed)",
  },
  {
    section: "sec-unary-operators-for-typed-values",
    title: "Unary minus and bitwise not wrap",
    summary: "-5 on an unsigned type is 2^8 - 5; ~0 is every bit set.",
    code: "console.log(-(5 := uint8), ~(0 := uint8));",
    expected: "251 (typed) 255 (typed)",
  },
  {
    section: "sec-unary-operators-for-typed-values",
    title: "Unary plus returns its operand",
    summary: "It computes nothing: the value comes back as itself, decimal precision included. Number() is how a program asks for the untyped Number instead.",
    code: 'const a = (7 := uint8);\nlet d: decimal128 = 1.50;\nconsole.log(Reflect.typeOf(+a) === uint8, (+d).toString(), Number(a));',
    expected: "true '1.50' 7",
  },
  {
    section: "sec-equality-and-comparison",
    title: "Literals compare, variables discriminate",
    summary: "A literal takes the typed side's type, so it compares equal; an untyped variable is a number, a different type, so === is false - as is uint8 against uint16.",
    code: "let n = 5;\nconsole.log((5 := uint8) === 5, (5 := uint8) === n, (5 := uint8) === (5 := uint16), (5 := uint8) === (5 := uint8));",
    expected: "true false false true",
  },
  {
    section: "sec-equality-and-comparison",
    title: "Typed values as keys",
    summary: "Map and Set use SameValueZero, which respects the type: a typed 5 and a plain 5 are two keys.",
    code: 'const m = new Map();\nm.set((5 := uint8), "typed");\nm.set(5, "plain");\nconsole.log(m.size, m.get((5 := uint8)));',
    expected: "2 'typed'",
  },
  {
    section: "sec-user-defined-operators",
    title: "An operator, overloaded by operand",
    summary: "operator* is declared twice - for a scalar and for another Vec - and the argument picks the body.",
    code: "class Vec {\n  constructor(x) { this.x = (x := uint32); }\n  operator*(rhs: uint32) { return new Vec(this.x * rhs); }\n  operator*(rhs: Vec) { return new Vec(this.x * rhs.x); }\n}\nconst a = new Vec(3);\nconst b = new Vec(4);\nconsole.log(Number((a * (2 := uint32)).x), Number((a * b).x));",
    expected: "6 12",
  },
  {
    section: "sec-user-defined-operators",
    title: "Comparison and equality operators",
    code: "class Money {\n  constructor(cents) { this.cents = cents; }\n  operator<(rhs) { return this.cents < rhs.cents; }\n  operator==(rhs) { return this.cents === rhs.cents; }\n}\nconst cheap = new Money(100);\nconst dear = new Money(500);\nconsole.log(cheap < dear, cheap == new Money(100));",
    expected: "true true",
  },
];
