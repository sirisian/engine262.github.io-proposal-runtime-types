import type { ExampleChapter } from "./types.mts";

/**
 * Declaration Reflection and Decorators (sec-decorators and children):
 * runtime decorators and their contexts, token streams, the replacement
 * pipeline, reflection shapes, retrieval, and the metadata channel. All
 * outputs verified by scripts/validate-examples.mts against the built
 * engine. The replacement pipeline cannot yet execute end to end
 * (KNOWN-DIVERGENCES.md D13), so those sections demonstrate their
 * machinery on the working substrate and cite the entry.
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
    summary: "The preprocessor attribute marks the import as compile-time; loading and running work (applying its macros does not yet: KNOWN-DIVERGENCES.md D13).",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function id(t) { return t; }\');\ndefineModule("main.js", \'import "macros.js" with { preprocessor: "true" };\\nconsole.log("compiled and ran");\');\nimport("main.js");',
    expected: "'compiled and ran'",
  },
  {
    section: "sec-replacement-decorators",
    title: "The macro contract",
    summary: "A replacement decorator is tokens to tokens; here the contract runs by hand (the pipeline itself is D13).",
    code: 'function mark(tokens) {\n  return tokens.concat([{ kind: "identifier", value: "marked", span: tokens[0].span, tokens: undefined }]);\n}\nconst input = [{ kind: "identifier", value: "x", span: undefined, tokens: undefined }];\nconsole.log(mark(input).map(t => t.value).join(" "));',
    expected: "'x marked'",
  },
  {
    section: "sec-static-semantics-replacementdecoratornames",
    title: "The names the import binds",
    summary: "Only names imported with the preprocessor attribute expand; the binding set comes from the import (see D13 for applying them).",
    features: ["virtual-module-loader"],
    code: 'defineModule("macros.js", \'export function a(t) { return t; }\\nexport function b(t) { return t; }\');\ndefineModule("main.js", \'import { a } from "macros.js" with { preprocessor: "true" };\\nconsole.log("names bound");\');\nimport("main.js");',
    expected: "'names bound'",
  },
  {
    section: "sec-expansion",
    title: "Outer first",
    summary: "An outer decoration receives the inner ones unexpanded; run by hand, the outer mark lands first (pipeline: D13).",
    code: 'const tok = v => ({ kind: "identifier", value: v, span: undefined, tokens: undefined });\nconst mark = m => t => t.concat([tok(m)]);\nconsole.log(mark("B")(mark("A")([tok("class")])).map(t => t.value).join(" "));',
    expected: "'class A B'",
  },
  {
    section: "sec-when-expansion-happens",
    title: "Deterministic, so cacheable",
    summary: "Expansion happens at compile and must be a pure function of the tokens - the same macro on the same input is the same output (pipeline: D13).",
    code: 'const tok = v => ({ kind: "identifier", value: v, span: undefined, tokens: undefined });\nconst mark = m => t => t.concat([tok(m)]);\nconst input = [tok("class")];\nconsole.log(JSON.stringify(mark("Z")(input)) === JSON.stringify(mark("Z")(input)));',
    expected: "true",
  },
  {
    section: "sec-applyreplacementdecorator",
    title: "The factory form",
    summary: "@m(arg) calls m with the argument first; the function it returns is the replacement (pipeline: D13).",
    code: 'function pad(n) { return tokens => tokens; }\nconst input = [{ kind: "identifier", value: "x", span: undefined, tokens: undefined }];\nconsole.log(typeof pad(2), pad(2)(input).length);',
    expected: "'function' 1",
  },
  {
    section: "sec-syntax-replacement",
    title: "The tokens are the text",
    summary: "A statement's tokens joined by value read back as the source they replace (pipeline: D13).",
    code: 'let values = "";\nfunction g(c) { values = c.block[0].tokens.map(t => t.value).join(" "); }\n@g { let x = 1; }\nconsole.log(values);',
    expected: "'let x = 1 ;'",
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
    summary: "A method and a getter answer to their own shapes (a getter/setter pair on one name currently resolves to the setter for both: KNOWN-DIVERGENCES.md D14).",
    code: 'class A { m() {} get v(): uint8 { return 1; } }\nconsole.log(Reflect.getReflection.<Reflect.ClassMethod, A>("m").kind, Reflect.getReflection.<Reflect.ClassGetter, A>("v").kind);',
    expected: "'ClassMethod' 'ClassGetter'",
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
