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
    title: "A field takes the argument's type",
    summary: "Each application is a distinct type, so a field declared at a parameter holds what the application supplied - it defaults from that type and refuses what the type forbids, exactly as a concrete field does.",
    code: "class Box<T> { value: T; }\nconst b = new Box.<uint8>();\nconsole.log(b.value, b.value is uint8);\nb.value = 5;\nconsole.log(b.value, b.value is uint8);\nb.value = \"a string\";",
    throws: true,
    expected: "0 (typed) true\n5 (typed) true",
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
    title: "A declared parameter relates its instantiations",
    summary: "`out` declares a parameter covariant and `in` contravariant, so two instantiations of one nominal declaration relate along that position - which structural types already did by inference and a nominal type could not express at all.",
    code: "interface P<out T> { get(): T }\ninterface H<in T> { put(v: T): void }\ninterface B<T> { get(): T }\nconsole.log(Reflect.isAssignable(type P.<uint8>, type P.<uint8 | string>), Reflect.isAssignable(type P.<uint8 | string>, type P.<uint8>));\nconsole.log(Reflect.isAssignable(type H.<uint8 | string>, type H.<uint8>), Reflect.isAssignable(type H.<uint8>, type H.<uint8 | string>));\nconsole.log(Reflect.isAssignable(type B.<uint8>, type B.<uint8 | string>));",
    expected: "true false\ntrue false\nfalse",
  },
  {
    section: "sec-generic-variance",
    title: "Invariance is the default",
    summary: "With no variance declared, instantiations relate only to themselves - and the structural form agrees, since a writable member is invariant. The spec assigns declared variance a meaning but its grammar has no spelling for the declaration (KNOWN-DIVERGENCES.md D11).",
    code: "class Box<T> { constructor(v) { this.v = v; } }\nconsole.log(Reflect.isAssignable(type Box.<uint8>, type Box.<uint8>), Reflect.isAssignable(type Box.<uint8>, type Box.<uint16>));\ntype Narrow = { x: uint8 };\ntype Wide = { x: uint8 | string };\nconsole.log(Reflect.isAssignable(Narrow, Wide), Reflect.isAssignable(type { readonly x: uint8 }, type { readonly x: uint8 | string }));",
    expected: "true false\nfalse true",
  },
  {
    section: "sec-higher-kinded-parameters",
    title: "A parameter with a hole",
    summary: "W<_> declares a one-argument wrapper parameter with a generic default; the parameter stands for a declaration, not a type.",
    code: 'type Identity<T> = T;\ninterface I<W<_> = Identity> {}\nconsole.log("declared");',
    expected: "'declared'",
  },
];
