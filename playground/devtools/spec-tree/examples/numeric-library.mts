import type { ExampleChapter } from "./types.mts";

/**
 * The Numeric Library (sec-numeric-library and children): typed overloads of
 * the standard library, checked and saturating arithmetic, floored division,
 * clz, parsing, and the predicates. All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const numericLibrary: ExampleChapter = [
  {
    section: "sec-numeric-library",
    title: "The library speaks every family",
    summary: "abs on an int32 answers in int32; hypot on float32 stays exact where the result is.",
    code: "console.log(Math.abs(((0 - 5) := int32)) is int32, Number(Math.hypot((3 := float32), (4 := float32))));",
    expected: "true 5",
  },
  {
    section: "sec-overloading-of-the-standard-library",
    title: "One name, per-family behavior",
    summary: "Integer sqrt floors; the float64 signature is the one bare numbers get.",
    code: "console.log(Number(Math.sqrt((17 := uint8))), Math.sqrt(17));",
    expected: "4 4.123105625617661",
  },
  {
    section: "sec-checked-and-saturating-arithmetic",
    title: "Checked refuses to wrap",
    summary: "Plain + wraps 255+1 to 0; addChecked raises a RangeError instead.",
    code: "Math.addChecked((255 := uint8), (1 := uint8));",
    throws: true,
    expected: "",
  },
  {
    section: "sec-checked-and-saturating-arithmetic",
    title: "Saturating clamps",
    code: "console.log(Math.addSaturating((255 := uint8), (10 := uint8)), Math.subSaturating((0 := uint8), (1 := uint8)));",
    expected: "255 (typed) 0 (typed)",
  },
  {
    section: "sec-floored-division",
    title: "Three answers for negative division",
    summary: "The / operator truncates; divFloor rounds toward negative infinity; mod takes the divisor's sign.",
    code: "console.log(Number(((0 - 7) := int32) / (2 := int32)), Number(Math.divFloor(((0 - 7) := int32), (2 := int32))), Number(Math.mod(((0 - 7) := int32), (3 := int32))));",
    expected: "-3 -4 2",
  },
  {
    section: "sec-counting-leading-zeros",
    title: "clz knows the width",
    summary: "The answer is about the type's two's-complement encoding: 1 has seven leading zeros as a uint8 and thirty-one as a uint32.",
    code: "console.log(Math.clz((1 := uint8)), Math.clz((1 := uint32)));",
    expected: "7 (typed) 31 (typed)",
  },
  {
    section: "sec-parsing",
    title: "Every numeric type parses",
    summary: "parse returns a value of its type; integer parse takes a radix.",
    code: 'console.log(uint8.parse("200"), uint8.parse("ff", 16));',
    expected: "200 (typed) 255 (typed)",
  },
  {
    section: "sec-numeric-predicates",
    title: "The predicates answer for typed values",
    summary: "An int64 past 2^53 is not a safe integer - the predicate is about what a Number holds exactly, and the int64 holds the value exactly whatever the answer.",
    code: "console.log(Number.isInteger((3 := int32)), Number.isSafeInteger((1152921504606846976 := int64)));",
    expected: "true false",
  },
];
