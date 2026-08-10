import type { ExampleChapter } from "./types.mts";

/**
 * Generics (sec-generics and children): applications and their interning,
 * value parameters, specialization, where clauses, variance, and
 * higher-kinded parameters. All outputs verified by
 * scripts/validate-examples.mts against the built engine.
 */
export const generics: ExampleChapter = [
  {
    section: "sec-generics",
    title: "Applications intern like everything else",
    summary: "Box.<uint8> is one type wherever it is spelled, and a different one from Box.<uint16>.",
    code: "type Box<T> = { value: T };\ntype B8 = Box.<uint8>;\nconst b: B8 = { value: 5 };\nconsole.log(b.value, B8 === Box.<uint8>, Box.<uint8> === Box.<uint16>);",
    expected: "5 (typed) true false",
  },
  {
    section: "sec-generic-parameters-as-values",
    title: "A parameter can be a value",
    summary: "W: uint32 takes a value argument; methods and fields read it as an ordinary typed value.",
    code: "class Fixed<W: uint32> { size() { return W; } capacity = W; }\nconst f = new Fixed.<4>();\nconsole.log(f.size(), f.capacity);",
    expected: "4 (typed) 4 (typed)",
  },
  {
    section: "sec-generic-specialization",
    title: "Instantiations do not mix",
    summary: "Each application is a distinct type; A.<uint8> is not an A.<uint16>.",
    code: "class A<T> {}\nconst x: A.<uint16> = new A.<uint8>();",
    throws: true,
    expected: "",
  },
  {
    section: "sec-generic-where",
    title: "A where clause admits",
    code: "function only8<T>(x: T) where T === uint8 { return x; }\nconsole.log(only8.<uint8>((1 := uint8)) is uint8);",
    expected: "true",
  },
  {
    section: "sec-generic-where",
    title: "A where clause refuses the specialization",
    summary: "The clause is checked once the parameters are bound; a failing application is a type error against the clause.",
    code: "function only8<T>(x: T) where T === uint8 { return x; }\nonly8.<uint16>((1 := uint16));",
    throws: true,
    expected: "",
  },
  {
    section: "sec-generic-variance",
    title: "Invariance is the default",
    summary: "With no variance declared, instantiations relate only to themselves. Shown with a nominal generic because the structural form is wrongly accepted (KNOWN-DIVERGENCES.md D8); the spec assigns declared variance a meaning but its grammar has no spelling for the declaration (D11).",
    code: "class Box<T> { constructor(v) { this.v = v; } }\nconsole.log(Reflect.isAssignable(type Box.<uint8>, type Box.<uint8>), Reflect.isAssignable(type Box.<uint8>, type Box.<uint16>));",
    expected: "true false",
  },
  {
    section: "sec-higher-kinded-parameters",
    title: "A parameter with a hole",
    summary: "W<_> declares a one-argument wrapper parameter with a generic default; the parameter stands for a declaration, not a type.",
    code: 'type Identity<T> = T;\ninterface I<W<_> = Identity> {}\nconsole.log("declared");',
    expected: "'declared'",
  },
];
