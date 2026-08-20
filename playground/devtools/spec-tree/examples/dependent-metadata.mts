import type { ExampleChapter } from "./types.mts";

/**
 * Dependent Record Types (sec-dependent-record-types and children) and the
 * Metadata Protocol (sec-primitive-metadata and children). All outputs
 * verified by scripts/validate-examples.mts against the built engine.
 */
export const dependentAndMetadata: ExampleChapter = [
  {
    section: "sec-dependent-record-types",
    title: "A type with a predicate",
    summary: "The where clause runs with this bound to the value; membership answers it.",
    code: "type Pos = { a: uint8 } where this.a > 0;\nconsole.log({ a: (5 := uint8) } is Pos, { a: (0 := uint8) } is Pos);",
    expected: "true false",
  },
  {
    section: "sec-where-clauses",
    title: "The boundary enforces the predicate",
    code: "type Pos = { a: uint8 } where this.a > 0;\nlet p: Pos = { a: (0 := uint8) };",
    throws: true,
    expected: "",
  },
  {
    section: "sec-is-operator",
    title: "is asks; a boundary requires",
    summary: "The same failing value answers false to is and then throws at the binding.",
    code: "type Pos = { a: uint8 } where this.a > 0;\nconst v = { a: (0 := uint8) };\nconsole.log(v is Pos);\nlet p: Pos = v;",
    throws: true,
    expected: "false",
  },
  {
    section: "sec-discriminated-where-chains",
    title: "A conditional chain over a discriminant",
    summary: "The predicate branches on kind, so each variant carries its own payload requirement.",
    code: 'type S = { kind: "i" | "s", v: uint8 | string } where this.kind === "i" ? this.v is uint8 : this.v is string;\nconsole.log({ kind: "i", v: (5 := uint8) } is S, { kind: "i", v: "wrong" } is S);',
    expected: "true false",
  },
  {
    section: "sec-refinement-narrowing",
    title: "Deciding the discriminant narrows the payload",
    summary: "Inside the branch that fixes kind, the chain's facts type v as a uint8 - the arithmetic proves it.",
    code: 'type S = { kind: "i" | "s", v: uint8 | string } where this.kind === "i" ? this.v is uint8 : this.v is string;\nlet x: S = { kind: "i", v: (5 := uint8) };\nif (x.kind === "i") { console.log(x.v + (1 := uint8)); }',
    expected: "6 (typed)",
  },
  {
    section: "sec-primitive-metadata",
    title: "A meta declaration says what a value carries, not what a binding holds",
    summary: "`default` is the UNCONSTRAINED CONSTRAINT - what a value carries where it has no field of this meta type - and not the zero of the type the declaration names. The two were conflated, so declaring a meta type over `uint8` redefined the zero of a primitive; a binding still takes its own type\'s default.",
    code: "meta uint8 { subtype(a, b) { return true; } default = 7; }\nlet x: uint8;\nconsole.log(x);\nlet y: uint8.<7> = (7 := uint8.<7>);\nconsole.log(y);",
    expected: "0 (typed)\n7 (typed)",
  },
  {
    section: "sec-meta-declarations",
    title: "A meta declaration may be generic",
    summary: "The production carries `TypeParameters?`, so a meta type may be parameterised over the type it constrains - which is what lets one bounds meta type serve every ordered value rather than only numbers. The parameter is in scope in the hooks\' annotations.",
    code: "interface Ordered<T> { v: T; }\ntype NumberBounds<T: Ordered.<T>> = { nonZero?: boolean };\nmeta NumberBounds<T: Ordered.<T>> {\n  default = {};\n  subtype(sub: NumberBounds.<T>, sup: NumberBounds.<T>): boolean { return true; }\n}\nconsole.log(\"declared\");",
    expected: "'declared'",
  },
  {
    section: "sec-meta-declarations",
    title: "A base-form meta type has no parameter to bind",
    summary: "A meta declaration may name a PRIMITIVE instead of an object type, declaring a base form - and a primitive has nothing for a parameter to stand for. The grammar allows `TypeParameters?` after any name, so this is refused as an early error rather than by failing to parse.",
    code: "meta uint8<T> { default = 0; subtype(a, b) { return true; } }",
    throws: true,
    expected: "",
  },
  {
    section: "sec-meta-declarations",
    title: "The required members are checked",
    summary: "A meta block must supply subtype and default; one with only validate is refused.",
    code: "meta uint8 { validate(v, c) { return true; } }",
    throws: true,
    expected: "",
  },
  {
    section: "sec-metadata-decomposition",
    title: "Metadata compares by structure",
    summary: "Equal nested records are one parameterization; arrays compare in order.",
    code: "type M = { m: number };\nmeta M { default = { m: 0 }; subtype(a, b) { return true; } }\nconsole.log(Reflect.isAssignable(type float32.<{ m: { a: 1 } }>, type float32.<{ m: { a: 1 } }>), Reflect.isAssignable(type float32.<{ m: [1, 2] }>, type float32.<{ m: [2, 1] }>));",
    expected: "true false",
  },
  {
    section: "sec-metadataportion",
    title: "Each meta type judges its portion",
    summary: "The always-true subtype hook makes every base value a member of the parameterization.",
    code: "meta float64 { default = {}; subtype(a, b) { return true; } }\nconsole.log((1 := float64) is float64.<{ a: 1 }>);",
    expected: "true",
  },
  {
    section: "sec-metadata-conversion",
    title: "Kilometers become meters at the boundary",
    summary: "Two parameterizations of one base convert; conversionFactor scales 1.5 km to 1500 m.",
    code: "type Dim = { m: number, ratio: number };\nmeta Dim { default = { m: 0, ratio: 1 }; subtype(a, b) { return a.m === b.m; } validate(v, c) { return true; } conversionFactor(a, b) { return a.ratio / b.ratio; } }\ntype Meter = float32.<{ m: 1, ratio: 1 }>;\ntype Kilometer = float32.<{ m: 1, ratio: 1000 }>;\nlet k: Kilometer = (1.5 := Kilometer);\nlet m: Meter = k;\nconsole.log(m, k);",
    expected: "1500 (typed) 1.5 (typed)",
  },
  {
    section: "sec-convertparameterization",
    title: "The factor runs both directions",
    code: "type Dim = { m: number, ratio: number };\nmeta Dim { default = { m: 0, ratio: 1 }; subtype(a, b) { return a.m === b.m; } validate(v, c) { return true; } conversionFactor(a, b) { return a.ratio / b.ratio; } }\ntype Meter = float32.<{ m: 1, ratio: 1 }>;\ntype Kilometer = float32.<{ m: 1, ratio: 1000 }>;\nlet m: Meter = (1500 := Meter);\nlet back: Kilometer = m;\nconsole.log(back);",
    expected: "1.5 (typed)",
  },
  {
    section: "sec-metadata-narrowing",
    title: "The narrow hook",
    summary: "A meta type may define narrow(m, op, c), consulted when a comparison against a constant narrows the metadata.",
    code: 'type Dim = { m: number };\nmeta Dim { default = { m: 0 }; subtype(a, b) { return a.m === b.m; } narrow(m, op, c) { return m; } }\nconsole.log("narrow accepted");',
    expected: "'narrow accepted'",
  },
  {
    section: "sec-primitive-operator-blocks",
    title: "Operators for a parameterization",
    summary: "The primitive block declares the conversion into float64.<{ m: 1 }>, so the literal binding works.",
    code: "type B = { m: number };\nmeta B { default = { m: 0 }; subtype(a, b) { return a.m === b.m; } validate(v, c) { return true; } }\nprimitive float64 { operator float64.<{ m: 1 }>(): float64.<{ m: 1 }> { return this; } }\nlet a: float64.<{ m: 1 }> = 5;\nconsole.log(a, a is float64.<{ m: 1 }>);",
    expected: "5 (typed) true",
  },
];
