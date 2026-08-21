import type { ExampleChapter } from "./types.mts";

/**
 * Reflection (sec-reflection and children): Reflect.typeOf, opacity,
 * getReflection/makeType and their round trip, isAssignable, never, declared
 * types under the existing reflective operations, and weak references. All
 * outputs verified by scripts/validate-examples.mts against the built engine.
 */
export const reflection: ExampleChapter = [
  {
    section: "sec-reflection",
    title: "Reflect is the door",
    summary: "getReflection opens a type into plain data and makeType closes it again - to the same interned object.",
    code: "type O = { a: uint8 };\nconsole.log(Reflect.makeType(Reflect.getReflection(O)) === O);",
    expected: "true",
  },
  {
    section: "sec-reflect-typeof",
    title: "The runtime type of any value",
    code: 'console.log(Reflect.typeOf(3.5) === number, Reflect.typeOf("x") === string, Reflect.typeOf((3 := uint8)) === uint8);',
    expected: "true true true",
  },
  {
    section: "sec-type-object-opacity",
    title: "A Type Object keeps its structure to itself",
    summary: "No property reveals an element type or a name; Reflect.getReflection is the one way in.",
    code: "type A = [].<uint32>;\nconsole.log(A.element, uint8.name);",
    expected: "undefined undefined",
  },
  {
    section: "sec-reflect-getreflection",
    title: "Properties come back in key order",
    summary: "Interning merges every spelling of a type into one object, so reporting the source's own order would report the first spelling's - an accident of load order. A reflected object type lists its properties in key order whatever the source wrote.",
    code: 'type B = { y: string, x: uint8 };\nconsole.log(Reflect.getReflection(B).properties.map(p => p.name).join(","));',
    expected: "'x,y'",
  },
  {
    section: "sec-reflect-getreflection",
    title: "Structure as plain data",
    code: "type O = { a: uint8 };\nconst r = Reflect.getReflection(O);\nconsole.log(String(r.kind), r.properties[0].name, r.properties[0].type === uint8);",
    expected: "'object' 'a' true",
  },
  {
    section: "sec-reflect-maketype",
    title: "A node becomes the interned type",
    code: 'const T = Reflect.makeType({ kind: "object", properties: [{ name: "x", type: uint8 }] });\nconsole.log(T === type { x: uint8 });',
    expected: "true",
  },
  {
    section: "sec-reflect-isassignable",
    title: "Assignability as a question",
    summary: "Everything accepts any and never; nothing but never accepts never.",
    code: "console.log(Reflect.isAssignable(uint8, any), Reflect.isAssignable(never, uint8), Reflect.isAssignable(uint8, never));",
    expected: "true true false",
  },
  {
    section: "sec-reflect-never",
    title: "The empty union has a name",
    code: 'console.log(typeof (type never), Reflect.makeType({ kind: "union", arms: [] }) === (type never));',
    expected: "'object' true",
  },
  {
    section: "sec-reflection-and-declared-types",
    title: "Reflect.set respects the declared type",
    summary: "The typed property defaults, Reflect.get reads it, and Reflect.set runs the same boundary check as an assignment.",
    code: 'let o = {};\nReflect.defineProperty(o, "x", { type: uint8, writable: true });\nconsole.log(Reflect.get(o, "x"));\nReflect.set(o, "x", 300);',
    throws: true,
    expected: "0 (typed)",
  },
  {
    section: "sec-weak-references-and-typed-objects",
    title: "A typed instance has no weak identity",
    summary: "A value type has no identity for a weak reference to track, so WeakRef refuses it.",
    code: "class P { x: uint8; }\nnew WeakRef(new P());",
    throws: true,
    expected: "",
  },
];
