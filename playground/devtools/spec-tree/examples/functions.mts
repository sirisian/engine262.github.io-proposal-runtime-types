import type { ExampleChapter } from "./types.mts";

/**
 * Functions and Overloading (sec-functions and children): signatures,
 * function-type identity and variance, overload resolution, named arguments,
 * return-type overloading, and annotations across the function forms. All
 * outputs verified by scripts/validate-examples.mts against the built engine.
 */
export const functions: ExampleChapter = [
  {
    section: "sec-functions",
    title: "Two bodies, one name",
    summary: "Declaring the name again adds a signature; the argument's type picks the body.",
    code: 'function f(x: uint8) { return "u8"; }\nfunction f(x: string) { return "str"; }\nconsole.log(f((1 := uint8)), f("hi"));',
    expected: "'u8' 'str'",
  },
  {
    section: "sec-signature-records",
    title: "A signature, reflected",
    summary: "A function type carries a list of Signature Records; reflection shows the parameters and return.",
    code: "type F = (a: uint8, b: string) => boolean;\nconst r = Reflect.getReflection(F);\nconsole.log(String(r.kind), r.signatures.length, r.signatures[0].parameters.length, r.signatures[0].return.type === boolean);",
    expected: "'function' 1 2 true",
  },
  {
    section: "sec-function-type-identity-and-subtyping",
    title: "Parameter names are not part of the type",
    code: "type F = (x: uint8) => void;\ntype G = (y: uint8) => void;\nconsole.log(F === G);",
    expected: "true",
  },
  {
    section: "sec-samefunctiontype",
    title: "The return type is",
    code: "type R1 = () => uint8;\ntype R2 = () => uint16;\nconsole.log(R1 === R2);",
    expected: "false",
  },
  {
    section: "sec-issignaturesubtype",
    title: "Parameters are contravariant",
    summary: "A function accepting the union serves anywhere one accepting the member is expected - not the reverse.",
    code: "type Wide = (x: uint8 | string) => void;\ntype Narrow = (x: uint8) => void;\nconsole.log(Reflect.isAssignable(Wide, Narrow), Reflect.isAssignable(Narrow, Wide));",
    expected: "true false",
  },
  {
    section: "sec-isfunctionsubtype",
    title: "Returns are covariant",
    summary: "A function promising the member can stand in for one promising the union.",
    code: "type R1 = () => uint8;\ntype R3 = () => (uint8 | string);\nconsole.log(Reflect.isAssignable(R1, R3), Reflect.isAssignable(R3, R1));",
    expected: "true false",
  },
  {
    section: "sec-overload-resolution",
    title: "The type selects the signature",
    summary: "A typed argument is not ranked; it goes to the signature its type is assignable to.",
    code: 'function width(x: uint8) { return "u8"; }\nfunction width(x: uint16) { return "u16"; }\nconsole.log(width((1 := uint8)), width((1 := uint16)));',
    expected: "'u8' 'u16'",
  },
  {
    section: "sec-resolveoverload",
    title: "No signature, no call",
    summary: "An argument no signature accepts is refused by the checker, before the program runs.",
    code: 'function f(x: uint8) { return "u"; }\nfunction f(x: string) { return "s"; }\nf(true);',
    throws: true,
    expected: "",
  },
  {
    section: "sec-named-arguments",
    title: "Arguments by name",
    code: 'function greet(first: string, last: string) { return first + " " + last; }\nconsole.log(greet(last: "Doe", first: "Jo"));',
    expected: "'Jo Doe'",
  },
  {
    section: "sec-named-arguments",
    title: "Positional and named mix",
    summary: "The named c lands on its parameter; the skipped b takes its default.",
    code: 'function f(a: uint32, b: string = "d", c: string = "e") { return b + c; }\nconsole.log(f(1, c: "C"));',
    expected: "'dC'",
  },
  {
    section: "sec-sequenceassignment",
    title: "Distribution around a default",
    summary: "Naming b lets SequenceAssignment give the optional a its default instead of the argument.",
    code: 'function f(a: string = "d", b: string) { return a + b; }\nconsole.log(f(b: "a"));',
    expected: "'da'",
  },
  {
    section: "sec-bindarguments",
    title: "A missing required parameter is refused",
    code: 'function g(option1: string, option2: string) {}\ng(option2: "a");',
    throws: true,
    expected: "",
  },
  {
    section: "sec-overloading-on-return-type",
    title: "No context, no answer",
    summary: "Two signatures differ only in return; a bare call gives the ranking nothing to decide with.",
    code: 'function make(): uint32 { return 1; }\nfunction make(): string { return "two"; }\nmake();',
    throws: true,
    expected: "",
  },
  {
    section: "sec-overloading-on-return-type",
    title: "The position decides",
    summary: "The binding's annotation is the contextual type, and it selects the signature.",
    code: 'function make(): uint32 { return 1; }\nfunction make(): string { return "two"; }\nconst s: string = make();\nconst n: uint32 = make();\nconsole.log(s, n);',
    expected: "'two' 1 (typed)",
  },
  {
    section: "sec-completing-the-literal-ranking",
    title: "number outranks float64",
    summary: "For a bare literal, the completed ranking puts the existing number type first.",
    code: 'function pick(x: float64) { return "f64"; }\nfunction pick(x: number) { return "num"; }\nconsole.log(pick(1));',
    expected: "'num'",
  },
  {
    section: "sec-typed-arrow-functions",
    title: "An annotated arrow",
    code: "const add = (a: uint8, b: uint8): uint8 => a + b;\nconsole.log(add(2, 3), add(2, 3) instanceof uint8);",
    expected: "5 (typed) true",
  },
  {
    section: "sec-annotations-on-the-remaining-function-forms",
    title: "A method takes the same annotation",
    code: "const o = { double(x: uint8): uint8 { return x + x; } };\nconsole.log(o.double(4));",
    expected: "8 (typed)",
  },
];
