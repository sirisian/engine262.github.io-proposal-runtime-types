import type { ExampleChapter } from "./types.mts";

/**
 * Declaration Reflection and Decorators (sec-decorators and children):
 * runtime decorators and their contexts, token streams, the replacement
 * pipeline, reflection shapes, retrieval, and the metadata channel. All
 * outputs verified by scripts/validate-examples.mts against the built
 * engine. The replacement pipeline runs end to end, macros included:
 * a returned array is re-parsed, so a macro may rebuild a record - nested
 * ones included - and have the rebuilt one take effect. What a replacement
 * may not do is change the CONSTRUCT it replaces (KNOWN-DIVERGENCES.md
 * D13).
 */
export const decorators: ExampleChapter = [
  {
    section: "sec-decorators",
    title: "A decorator receives its context",
    code: 'const log = [];\nfunction f(c) { log.push(c.kind + ":" + String(c.name)); }\nclass A { @f a: uint8; }\nconsole.log(log.join(","));',
    expected: "'ClassField:a'",
  },
  {
    section: "sec-token-records",
    title: "Tokens have a kind and a value",
    summary: "The block's statement is five Token Records; note that let lexes as an identifier-kind token.",
    code: 'let kinds = "";\nfunction g(c) { kinds = c.block[0].tokens.map(t => t.kind).join(","); }\n@g { let x = 1; }\nconsole.log(kinds);',
    expected: "'identifier,identifier,punctuator,numeric,punctuator'",
  },
  {
    section: "sec-tokensof",
    title: "An initializer as tokens",
    summary: "The context carries the initializer both evaluated (initial) and as its TokenStream.",
    code: 'let init = "";\nfunction h(c) { init = String(c.initial) + "|" + c.initializer.toString(); }\nclass A { @h x: uint8 = 3; }\nconsole.log(init);',
    expected: "'3|3'",
  },
  {
    section: "sec-tokenstream-objects",
    title: "A stream of statements",
    summary: "The block context is a TokenStream of statement streams.",
    code: 'let text = "";\nfunction g(c) { text = c.block.toString(); }\n@g { let x = 1; }\nconsole.log(text);',
    expected: "'{ let x = 1; }'",
  },
  {
    section: "sec-tokenstream.prototype.parse",
    title: "A macro delegates the ranges that are ECMAScript",
    summary: "`parse(start, end, goal)` takes SOURCE OFFSETS - read off a token\'s span, not token indices - and a goal of \"expression\" or \"statements\". This is what lets a replacement decorator define a syntax the implementation does not know: it reads whatever it likes and hands the ordinary parts back to the parser.",
    code: "let out = \"\";\nfunction g(c) {\n  const t = c.block;\n  const s = t[0].span;\n  const r = t.parse(s.start + 1, s.end - 1, \"statements\");\n  out = r.length + \" tokens, first \" + r[0].kind;\n}\n@g { let x = 1; }\nconsole.log(out);",
    expected: "'5 tokens, first identifier'",
  },
  {
    section: "sec-captured-regions",
    title: "A region carries its source with it",
    summary: "The captured region is not a copy of the text: every token holds the span it came from, so a macro can ask where it was as well as what it is - which is what makes delegating a sub-range possible at all.",
    code: "let out = \"\";\nfunction g(c) {\n  const s = c.block[0].span;\n  out = s.source.text + \" [\" + s.start + \",\" + s.end + \"]\";\n}\n@g { let x = 1; }\nconsole.log(out);",
    expected: "'{ let x = 1; } [0,14]'",
  },
  {
    section: "sec-tokenstream.prototype.tostring",
    title: "Round trip to source",
    code: 'let t = "";\nfunction g(c) { t = c.condition.toString(); }\nif (1 < 2) @g { 1; }\nconsole.log(t);',
    expected: "'1 < 2'",
  },
  {
    section: "sec-tokenstream.gensym",
    title: "A fresh identifier every time",
    code: 'const s = TokenStream.gensym("tmp");\nconsole.log(s.kind, TokenStream.gensym("a").value !== TokenStream.gensym("a").value);',
    expected: "'identifier' true",
  },
  {
    section: "sec-preprocessor-modules",
    title: "A module loaded for expansion",
    summary: "A preprocessor module is fetched and evaluated before the importing module is parsed, so its exports are callable at expansion. The macro here removes the declaration it decorates, and the binding never comes into existence.",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function drop(t) { return []; }\\nexport function keep(t) { return t; }\');\ndefineModule("main.js", \'import { drop, keep } from "macros.js" with { preprocessor: "true" };\\n@keep class K { v = 1; }\\n@drop class Gone { w = 2; }\\nglobalThis.out = typeof K + "," + typeof Gone;\');\nimport("main.js").then(() => console.log(globalThis.out));',
    expected: "'function,undefined'",
  },
  {
    section: "sec-replacement-decorators",
    title: "The macro contract",
    summary: "A replacement decorator is tokens to tokens: it receives the records of what it decorates and returns records, and what the module evaluates is what came back. The macro here rebuilds the class's name token, so the declaration that runs is one nothing in the source spells.",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function rename(t) { return t.map((k, i) => i === 1 ? { kind: k.kind, value: "Renamed", span: k.span, tokens: k.tokens } : k); }\');\ndefineModule("main.js", \'import { rename } from "macros.js" with { preprocessor: "true" };\\n@rename class Original { v = 7; }\\nglobalThis.out = typeof Original + "," + String(new Renamed().v);\');\nimport("main.js").then(() => console.log(globalThis.out));',
    expected: "'undefined,7'",
  },
  {
    section: "sec-static-semantics-replacementdecoratornames",
    title: "The names the import binds",
    summary: "The names an import BINDS are the names that expand. Here `a` is imported for the preprocessor and expands at compile; `b` is an ordinary function of the same shape and applies at run time instead, replacing its class with what it returns.",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function a(t) { return t; }\');\ndefineModule("main.js", \'import { a } from "macros.js" with { preprocessor: "true" };\\nfunction b(v) { return v; }\\n@a class P { }\\n@b class Q { }\\nglobalThis.out = typeof P + "," + typeof Q;\');\nimport("main.js").then(() => console.log(globalThis.out));',
    expected: "'function,object'",
  },
  {
    section: "sec-expansion",
    title: "Outer first",
    summary: "The outer decoration expands first and receives the inner one UNEXPANDED - `@inner` is still a token in what `@outer` is handed. What it saw has to be encoded into the tokens it returns, since a macro that reports through a side channel is refused as impure; here the class's name records the answer.",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function inner(t) { return t; }\\nexport function outer(t) { const saw = t.some(k => k.value === "inner"); return t.map(k => k.value === "C" ? { kind: k.kind, value: saw ? "SawInner" : "SawNothing", span: k.span, tokens: k.tokens } : k); }\');\ndefineModule("main.js", \'import { inner, outer } from "macros.js" with { preprocessor: "true" };\\n@outer @inner class C { }\\nglobalThis.out = typeof SawInner + "," + typeof SawNothing;\');\nimport("main.js").then(() => console.log(globalThis.out));',
    expected: "'function,undefined'",
  },
  {
    section: "sec-when-expansion-happens",
    title: "Deterministic, so cacheable",
    summary: "Expansion happens at compile, so a macro must be a pure function of its tokens - and the requirement is enforced rather than assumed: a macro that reaches outside them is refused as not compile-time evaluable, naming what it reached for.",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function impure(t) { globalThis.ran = true; return t; }\');\ndefineModule("main.js", \'import { impure } from "macros.js" with { preprocessor: "true" };\\n@impure class C { }\');\nimport("main.js").then(() => console.log("accepted"), e => console.log(e.constructor.name, String(e.message).includes("compile-time evaluable")));',
    expected: "'SyntaxError' true",
  },
  {
    section: "sec-applyreplacementdecorator",
    title: "The macro runs once, at expansion",
    summary: "The macro runs at expansion, once, and what it returns replaces the tokens it decorated - so the class the module evaluates is the one the macro produced.",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function keep(t) { return t; }\');\ndefineModule("main.js", \'import { keep } from "macros.js" with { preprocessor: "true" };\\n@keep class C { x = 41; }\\nglobalThis.out = new C().x + 1;\');\nimport("main.js").then(() => console.log("expanded and ran:", globalThis.out));',
    expected: "'expanded and ran:' 42",
  },
  {
    section: "sec-syntax-replacement",
    title: "The tokens are the text",
    summary: "The tokens ARE the text: a macro rebuilds the brace token with a different inner stream, and the class that evaluates has the member the replacement spells rather than the one the source did. Nesting is what makes this reach a member at all - a class arrives as `class`, its name, and one brace token carrying `.tokens`.",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function rename(t) { const b = t[t.length - 1]; const inner = b.tokens.map(k => k.value === "before" ? { kind: k.kind, value: "after", span: k.span, tokens: k.tokens } : k); return t.slice(0, t.length - 1).concat([{ kind: b.kind, value: b.value, span: b.span, tokens: inner }]); }\');\ndefineModule("main.js", \'import { rename } from "macros.js" with { preprocessor: "true" };\\n@rename class C { before = 5; }\\nglobalThis.out = Object.keys(new C()).join(",") + "," + String(new C().after);\');\nimport("main.js").then(() => console.log(globalThis.out));',
    expected: "'after,5'",
  },
  {
    section: "sec-decorator-contexts",
    title: "Member contexts nest their class",
    code: "let c;\nfunction f(x) { c = x; }\nclass Named { @f a: uint8; }\nconsole.log(c.kind, c.name, c.classContext.kind + \":\" + String(c.classContext.name));",
    expected: "'ClassField' 'a' 'Class:Named'",
  },
  {
    section: "sec-reflection-shapes",
    title: "The shape selects the overload",
    summary: "Annotating the decorator's parameter with a shape makes it apply only to matching targets.",
    code: 'const r = [];\nfunction f(c: Reflect.ClassField) { r.push("field:" + String(c.name)); }\nfunction f(c: Reflect.ClassMethod) { r.push("method:" + String(c.name)); }\nclass A { @f a: uint8; @f m() {} }\nconsole.log(r.join(","));',
    expected: "'field:a,method:m'",
  },
  {
    section: "sec-reflection-shape-rules",
    title: "A shape is a type",
    code: "let r;\nfunction f(c) { r = c is Reflect.ClassField; }\nclass A { @f a: uint8; }\nconsole.log(r);",
    expected: "true",
  },
  {
    section: "sec-reflection-shape-class",
    title: "The Class shape",
    code: "class Named {}\nconst r = Reflect.getReflection.<Reflect.Class, Named>();\nconsole.log(Object.getOwnPropertyNames(r).join(\",\"), r.type === Named);",
    expected: "'kind,name,type,abstract,metadata' true",
  },
  {
    section: "sec-reflection-shape-class-field-layout",
    title: "Where a field sits",
    summary: "The uint32 lands at offset 4 - naturally aligned past the uint8.",
    code: 'class A { a: uint8; b: uint32; }\nconst layout = Reflect.getReflection.<Reflect.ClassFieldLayout, A>("b");\nconsole.log(layout.kind, layout.offset);',
    expected: "'ClassFieldLayout' 4",
  },
  {
    section: "sec-reflection-shape-function",
    title: "The Function shape",
    code: 'let k;\nfunction f(c) { k = c.kind + ":" + String(c.name); }\n@f function greet() {}\nconsole.log(k);',
    expected: "'Function:greet'",
  },
  {
    section: "sec-reflection-shape-binding",
    title: "The binding shapes",
    code: 'let k;\nfunction f(c) { k = c.kind + ":" + String(c.name); }\n@f let x = 1;\nconsole.log(k);',
    expected: "'Let:x'",
  },
  {
    section: "sec-reflection-shape-object",
    title: "An object literal's field",
    code: 'let k;\nfunction f(c) { k = c.kind + ":" + String(c.name); }\nconst o = { @f a: 1 };\nconsole.log(k);',
    expected: "'ObjectField:a'",
  },
  {
    section: "sec-reflection-shape-block",
    title: "Blocks know their statement form",
    code: 'let k;\nlet n = 0;\nfunction g(c) { k = c.kind; }\nouter: while (n < 1) @g { n += 1; }\nconsole.log(k);',
    expected: "'WhileBlock'",
  },
  {
    section: "sec-reflection-shape-enum",
    title: "The Enum shape",
    code: 'let k;\nfunction f(c) { k = c.kind + ":" + String(c.name); }\n@f enum E { A }\nconsole.log(k);',
    expected: "'Enum:E'",
  },
  {
    section: "sec-reflection-shape-structural",
    title: "The value picks Tuple or Record",
    summary: "Decorating a composite reflects the value's own family, not the syntax.",
    code: "let grabbed;\nfunction f(c) { grabbed = c.kind; }\nconst t = @f Composite([0]);\nconsole.log(grabbed);\nconst r = @f Composite({ a: 1 });\nconsole.log(grabbed);",
    expected: "'Tuple'\n'Record'",
  },
  {
    section: "sec-replacement-values",
    title: "What a return replaces",
    summary: "A method decorator's function replaces the method; a field decorator's value replaces the initial.",
    code: 'function rep(c) { return function() { return "replaced"; }; }\nclass A { @rep m() { return "original"; } }\nconsole.log(new A().m());\nfunction init99(c) { return 99; }\nclass B { @init99 a: uint8 = 1; }\nconsole.log(new B().a);',
    expected: "'replaced'\n99 (typed)",
  },
  {
    section: "sec-addinitializer",
    title: "Bodies first, callbacks after, in added order",
    summary: "@a @b applies b first, so both bodies run before either callback, and b's callback was added first.",
    code: 'const l = [];\nfunction a(c) { c.addInitializer(() => l.push("a-init")); l.push("a"); }\nfunction b(c) { c.addInitializer(() => l.push("b-init")); l.push("b"); }\nclass A { @a @b m() {} }\nconsole.log(l.join(","));',
    expected: "'b,a,b-init,a-init'",
  },
  {
    section: "sec-reflection-retrieval",
    title: "Ask by shape and name",
    code: 'class A { m() {} }\nconsole.log(Reflect.getReflection.<Reflect.ClassMethod, A>("m").kind);',
    expected: "'ClassMethod'",
  },
  {
    section: "sec-reflect-getreflectionbyindex",
    title: "Parameters come indexed",
    code: 'class A { m(first: uint8, second: string) {} }\nconst params = Reflect.getReflectionByIndex.<Reflect.ClassMethodParameter, A>("m");\nconsole.log(params.length, params[1].index, params[1].name);',
    expected: "2 1 'second'",
  },
  {
    section: "sec-reflection-own-option",
    title: "Inherited by default, own on request",
    summary: "Every class has a constructor - the table makes it a ClassMethod of that name - so it appears in both answers; what the option changes is whether the base class's method does.",
    code: 'class B { base() {} }\nclass D extends B { own() {} }\nconsole.log(Object.keys(Reflect.getReflection.<Reflect.ClassMethod, D>()).sort().join(","));\nconsole.log(Object.keys(Reflect.getReflection.<Reflect.ClassMethod, D>({ own: true })).sort().join(","));',
    expected: "'base,constructor,own'\n'constructor,own'",
  },
  {
    section: "sec-retrieval-overloaded-targets",
    title: "The shape decides among same-named members",
    summary: "The context names the part of the class to reflect, so a getter and a setter sharing ONE name are two parts and each answers to its own shape.",
    code: 'class A { get v(): uint8 { return 1; } set v(x: uint8) {} }\nconsole.log(Reflect.getReflection.<Reflect.ClassGetter, A>("v").kind, Reflect.getReflection.<Reflect.ClassSetter, A>("v").kind);\nconsole.log(Object.keys(Reflect.getReflection.<Reflect.ClassGetter, A>()).join(","));',
    expected: "'ClassGetter' 'ClassSetter'\n'v'",
  },
  {
    section: "sec-reflect-getmetadata",
    title: "Reading the channel back",
    code: 'const k = Symbol("k");\nfunction f(c) { c.metadata[k] = "v"; }\nclass A { @f m() {} }\nconsole.log(Reflect.getMetadata.<Reflect.ClassMethod, A>("m")[k]);',
    expected: "'v'",
  },
  {
    section: "sec-decorator-metadata",
    title: "The same object, not a snapshot",
    summary: "getMetadata answers the object the decorator wrote into.",
    code: 'const k = Symbol("k");\nfunction f(c) { c.metadata[k] = "written"; }\n@f class A {}\nconsole.log(Reflect.getMetadata.<Reflect.Class, A>()[k]);',
    expected: "'written'",
  },
  {
    section: "sec-decorator-application",
    title: "Members before the class",
    code: 'const l = [];\nfunction m(c) { l.push("member"); }\nfunction cls(c) { l.push("class"); }\n@cls class A { @m a: uint8; }\nconsole.log(l.join(","));',
    expected: "'member,class'",
  },
];
