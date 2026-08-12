import type { ExampleChapter } from "./types.mts";

/**
 * Classes, Interfaces, and Enums (sec-classes-interfaces-and-enums and
 * children): object types, typed classes and their sealing, abstract, sealed,
 * and partial classes, interfaces, and enums. All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const classes: ExampleChapter = [
  {
    section: "sec-classes-interfaces-and-enums",
    title: "A class is a nominal type",
    summary: "The declaration is the type: subclass instances belong, a same-shaped object literal does not.",
    code: "class A {}\nclass B extends A {}\nconst T = type A;\nconsole.log(new A() instanceof T, new B() instanceof T, {} instanceof T);",
    expected: "true true false",
  },
  {
    section: "sec-object-types-semantics",
    title: "Members carry flags",
    summary: "A Property Type Record records optionality alongside the type.",
    code: "type O = { a: uint8, b?: string };\nconst r = Reflect.getReflection(O);\nconsole.log(r.properties.length, r.properties[1].optional);",
    expected: "2 true",
  },
  {
    section: "sec-sameobjecttype",
    title: "Member order is not identity",
    summary: "Members are matched by key, so the order an object type lists them in is not part of what it is - the clause's own example, and one type.",
    code: "type A = { x: float32, y: float32 };\ntype B = { y: float32, x: float32 };\nconsole.log(A === B);",
    expected: "true",
  },
  {
    section: "sec-sameobjecttype",
    title: "The flags are part of the identity",
    summary: "Only order stops mattering: an optional member is a different member, and so is one of a different type.",
    code: "type C = { x: uint8 };\ntype D = { x?: uint8 };\ntype W = { x: uint16 };\nconsole.log(C === D, C === W);",
    expected: "false false",
  },
  {
    section: "sec-isobjectsubtype",
    title: "More members, narrower type",
    summary: "The wider record satisfies the narrower requirement - width subtyping.",
    code: "type Wide = { x: uint8, y: string };\ntype Narrow = { x: uint8 };\nconsole.log(Reflect.isAssignable(Wide, Narrow), Reflect.isAssignable(Narrow, Wide));",
    expected: "true false",
  },
  {
    section: "sec-typed-classes",
    title: "A typed field seals the class",
    summary: "One typed field freezes the prototype and seals every instance; the field itself stays writable and checked.",
    code: "class A { a: uint8; }\nconsole.log(Object.isFrozen(A.prototype), Object.isExtensible(new A()));",
    expected: "true false",
  },
  {
    section: "sec-typed-classes",
    title: "dynamic opts out",
    code: "dynamic class D { d: uint8; }\nconsole.log(Object.isFrozen(D.prototype));",
    expected: "false",
  },
  {
    section: "sec-abstract-classes",
    title: "Abstract classes type their subclasses",
    code: "abstract class Shape { area(): float64 { return 0; } }\nclass Circle extends Shape {}\nconsole.log(new Circle() instanceof (type Shape));",
    expected: "true",
  },
  {
    section: "sec-abstract-classes",
    title: "An abstract class does not instantiate",
    code: "abstract class Shape {}\nnew Shape();",
    throws: true,
    expected: "",
  },
  {
    section: "sec-interfaces-semantics",
    title: "Interfaces are nominal to each other",
    summary: "Two interfaces with one shape are two types - unlike object type aliases, which intern structurally.",
    code: "interface I { a: uint8 }\ninterface J { a: uint8 }\nconsole.log(I === J);",
    expected: "false",
  },
  {
    section: "sec-interfaces-semantics",
    title: "Structural at the boundary, member by member",
    summary: "An any value checked against the interface converts each member: the number 300 becomes the string \"300\".",
    code: 'interface Point { x: string }\nfunction anyv() { return { x: 300 }; }\nlet p: Point = anyv();\nconsole.log(p.x, typeof p.x);',
    expected: "'300' 'string'",
  },
  {
    section: "sec-enums",
    title: "Members number themselves",
    summary: "Auto-numbering continues after an explicit value, and the enum maps values back to members.",
    code: "enum Color { Red, Green = 10, Blue }\nconsole.log(Color.Red, Color.Blue, Color(10) === Color.Green);",
    expected: "0 (typed) 11 (typed) true",
  },
  {
    section: "sec-enums",
    title: "Membership is nominal",
    summary: "A bare 0 is a number that happens to match; only a member value is of the enum type.",
    code: "enum E { A }\nconsole.log(E.A is E, 0 is E);",
    expected: "true false",
  },
  {
    section: "sec-sealed-classes",
    title: "Sealed within its module",
    summary: "Extension inside the declaring module is fine; a sealed class's subclasses are a fixed set beyond it.",
    code: "sealed class Base {}\nclass Sub extends Base {}\nconsole.log(new Sub() instanceof (type Base));",
    expected: "true",
  },
  {
    section: "sec-partial-classes",
    title: "Re-opening a class",
    summary: "A partial declaration names an existing class and merges its members in.",
    code: "class Point { constructor() { this.v = 2; } }\npartial class Point { double() { return this.v * 2; } }\nconsole.log(new Point().double());",
    expected: "4",
  },
];
