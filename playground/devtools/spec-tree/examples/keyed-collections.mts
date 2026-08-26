import type { ExampleChapter } from "./types.mts";

/**
 * Keyed collections (sec-keyed-collections and children): the count a typed
 * collection reports, the members that walk it, the type it reports as its own,
 * which values are of it, how it acquires its type, and the collection that has
 * none of it. All outputs verified by scripts/validate-examples.mts against the
 * built engine.
 */
export const keyedCollections: ExampleChapter = [
  {
    section: "sec-keyed-collections",
    title: "Every position follows from the type arguments",
    summary:
      "A Map.<K, V> takes its key and value at the declared types, answers V | undefined from a lookup, and reports a count of its own.",
    code:
      'const m = new Map.<string, uint8>();\nm.set("a", 1);\nconsole.log(m.get("a"), m.get("missing"), m.size);',
    expected: "1 (typed) undefined 1 (typed)",
  },
  {
    section: "sec-collection-size",
    title: "size reads at the index type",
    summary:
      "One type for every count a container reports, so a collection's size is comparable with an array's length. Before this the comparison was a TypeError.",
    code:
      'const m = new Map.<string, uint8>();\nm.set("a", 1);\nconst a: [].<uint8> = [1, 2, 3];\nconsole.log(m.size < a.length, Reflect.typeOf(m.size) === (type uint64));',
    expected: "true true",
  },
  {
    section: "sec-collection-size",
    title: "A weak collection reports no count",
    summary:
      "WeakMap and WeakSet have no size: what they hold may be reclaimed between one step of a walk and the next, so there is no count to report.",
    code:
      "const w: WeakMap.<object, uint8> = new WeakMap();\nconst n = w.size;",
    throws: true,
  },
  {
    section: "sec-collection-iteration",
    title: "A Map iterates as pairs, a Set as its elements",
    summary:
      "keys, values and entries carry the element types, and a chain of iterator helpers keeps them.",
    code:
      'const m = new Map.<string, uint8>();\nm.set("a", 1);\nm.set("b", 2);\nconsole.log(m.keys().toArray().join(","), m.values().toArray().join(","));\nconsole.log(m.entries().toArray().length, [...m][0][0]);',
    expected: "'a,b' '1,2'\n2 'a'",
  },
  {
    section: "sec-collection-iteration",
    title: "forEach takes its value first",
    summary:
      "The order the language chose, and the order a reader most often gets wrong. Stating it is most of what typing forEach is worth.",
    code:
      'const m = new Map.<string, uint8>();\nm.set("a", 1);\nlet seen = "";\nm.forEach((value, key) => { seen = key + ":" + value; });\nconsole.log(seen);',
    expected: "'a:1'",
  },
  {
    section: "sec-collection-runtimetypeof",
    title: "A collection reports the type it was built at",
    summary:
      "Carried rather than inferred: a Map.<string, uint8> and a Map.<string, string> have the same shape and the same prototype, so only the carried arguments tell them apart.",
    code:
      "const typed = new Map.<string, uint8>();\nconst plain = new Map();\nconsole.log(Reflect.typeOf(typed) === (type Map.<string, uint8>));\nconsole.log(Reflect.typeOf(typed) === (type Map.<string, string>), Reflect.typeOf(plain) === (type Map));",
    expected: "true\nfalse true",
  },
  {
    section: "sec-collection-membership",
    title: "Membership discriminates on the type arguments",
    summary:
      "An instantiation is a claim about what a collection will accept next, not about what it currently holds - so an untyped Map is of no instantiation however its entries look.",
    code:
      'const typed = new Map.<string, uint8>();\nconst plain = new Map();\nplain.set("a", 1);\nconsole.log(typed is Map.<string, uint8>, typed is Map.<string, string>);\nconsole.log(plain is Map.<string, uint8>, plain is Map);',
    expected: "true false\nfalse true",
  },
  {
    section: "sec-collection-construction",
    title: "A seed is checked on the way in",
    summary:
      "Acquiring the type is the same operation as checking that the value was already of it, so a constructor's seed cannot smuggle an entry past the element type.",
    code: 'const s = new Set.<uint8>(["a"]);',
    throws: true,
  },
  {
    section: "sec-collection-construction",
    title: "A seeded entry is converted, not merely checked",
    summary:
      "A boundary converts, so an element that entered through the constructor and one that entered through add are of one type afterwards.",
    code:
      "const s = new Set.<uint8>([1]);\ns.add(2);\nconsole.log([...s].map((v) => Reflect.typeOf(v) === (type uint8)).join(\",\"));",
    expected: "'true,true'",
  },
  {
    section: "sec-collection-construction",
    title: "A subclass of an instantiation carries it",
    summary:
      "The heritage's type arguments reach the instance, and a subclass of that subclass inherits them.",
    code:
      "class M extends Map.<string, uint8> { }\nclass N extends M { }\nconsole.log(new M() is Map.<string, uint8>, new N() is Map.<string, uint8>);",
    expected: "true true",
  },
  {
    section: "sec-untyped-collections",
    title: "A collection with no type arguments is untouched",
    summary:
      "size is a Number, keys and values are unconstrained, and no program that does not use these types can observe any of the typed surface.",
    code:
      'const m = new Map();\nm.set(1, "a");\nm.set("b", {});\nconsole.log(typeof m.size, m.size + 1, m.size < [1, 2].length);',
    expected: "'number' 3 false",
  },
  {
    section: "sec-untyped-collections",
    title: "The two forms coexist without interacting",
    summary:
      "An instantiation adds nothing to the shared prototype and changes nothing about the constructor.",
    code:
      'const typed = new Set.<uint8>();\nconst plain = new Set();\nplain.add("anything");\nconsole.log(plain.size, Object.getPrototypeOf(typed) === Set.prototype);',
    expected: "1 true",
  },
  {
    section: "sec-getsetrecord-revised",
    title: "A count is checked rather than coerced",
    summary:
      "A set operation reads the other operand's size. A typed collection's is a value of the index type and is read directly; an ordinary set-like's is a Number and takes the unchanged path.",
    code:
      "const a = new Set.<uint8>([1]);\nconst b = new Set.<uint8>([2]);\nconst like = { size: 1, has: (v) => v === 3, keys: () => [3][Symbol.iterator]() };\nconsole.log([...a.union(b)].join(\",\"), [...a.union(like)].join(\",\"));",
    expected: "'1,2' '1,3'",
  },
];
