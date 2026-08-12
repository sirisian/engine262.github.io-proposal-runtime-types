# Known engine/spec divergences found while authoring examples

Hand-maintained. Each entry is something the specification sanctions that the
engine (lib/engine262 as of the date noted) rejects or mishandles, or - where
marked (spec) - something the specification itself leaves unreachable. All
were found while writing the specification tree's examples, by running every
example against the built engine.

This file is the work list. Working through it top to bottom should end with
every example in the tree written in its natural spelling rather than a
workaround. For each entry: fix the engine (or the spec), then open the
"affected examples" listed under it, restore the natural spelling, drop the
citation from the summary, re-run `node scripts/validate-examples.mts`, and
delete the entry.

Every example that works around an entry cites it by number in its summary, so
`grep -rn "D<n>" *.mts` finds the sites. An entry with no affected examples is
one whose sections currently ship an honest "not yet in the engine" example
instead - those need rewriting into real examples when the entry closes, and
say so.

Automated findings (examples that run but print something unexpected) go to
FINDINGS.md, written by scripts/validate-examples.mts. That file is generated;
this one is not.

## Index

| # | Summary | Side | Affected examples |
| --- | --- | --- | --- |
| D7 | Writes through a `readonly` member are not refused | engine | sec-object-types |
| D8 | Writable members are wrongly covariant in depth | engine | sec-generic-variance (nominal form used) |
| D9 | int64/uint64 are double-backed, not exact | engine | sec-numeric-predicates, sec-numeric-types-of-this-proposal |
| D10 | Imaginary literals and complex types unimplemented | engine | sec-imaginary-literals, sec-complex-types, sec-complex-numbers (all ship refusals) |
| D11 | Variance declarations have semantics but no grammar | **spec** | sec-generic-variance |
| D12 | Literal written through a typed `ref` untypes the binding | engine | sec-references-and-borrowing |
| D13 | Replacement pipeline cannot execute end to end | engine | six sec-decorators pipeline sections |
| D14 | Getter shape retrieval returns the setter | engine | sec-retrieval-overloaded-targets |
| D15 | Deferred application unusable as a binding's type | engine | sec-deferred-applications |
| D16 | Object literal freshness is not enforced | engine | sec-literal-freshness |
| D17 | Declarative checker facts unimplemented | engine + **spec** | sec-declarative-checker-facts, sec-this-adoption, sec-declared-narrowing |
| D18 | Parameterized primitive families unbound in expression position | engine | sec-canonicalizetype |
| D19 | ThreadLocal storage does not default to DefaultValueOf(T) | engine | sec-threadlocal-objects |
| D23 | float128 has no value representation | engine | sec-binary-floating-point-types |
| D24 | A specialized generic's field type is not substituted | engine | sec-generic-specialization |
| D25 | A `var` binding does not take its type's default | engine | sec-defaultvalueof |
| D22 | (spec) DefaultValueOf's parameterized step can return a non-member | **spec** | sec-defaultvalueof |

## Deferred by the engine, tracked here for the same reason

These are not divergences - the engine's own conformance matrix
(test/engine262/runtime-types/numeric-library/conformance-matrix.test.mts)
records them as deliberately deferred - but the tree's examples for these
sections currently demonstrate their absence, and should become real examples
when the features land:

- `Reflect.inferSlot` and `Reflect.matchType` (`sec-structural-matching`). The
  clause itself calls the operation optional.
- The reflected `origin` property (`sec-provenance`). Provenance is
  implemented as a host-facing channel instead, and the specification was
  changed to make it so; the example asserts that identity does not read
  origins, which stays true either way.
- The complex value level, which is D10's other half.

Also worth knowing when reading the tree: the evaluation budget
(`sec-evaluation-budget`) is host-configured through ManagedRealm and cannot
be exercised from the playground at all, so its example demonstrates that
ordinary programs are unaffected and says so in its summary.

## D7 - Writes through a readonly object-type member are not refused (2026-08-10)

`#sec-isobjectsubtype` makes readonly members covariant "since a value read
from it and never written through it need only be of the required type" - the
premise is that writes are refused. Class readonly fields enforce this
(classes/readonly-fields.test.mts); structural object-type readonly does not:

```js
type R = { readonly x: uint8 };
let v: R = { x: 1 };
v.x = 2;      // succeeds; should be a checker error
v.x;          // 2
```

Affected examples: `sec-object-types`, which shows the reflected flag and
readonly's covariance but does not attempt a write. Add the refused write
when this closes.
## D8 - Writable members are wrongly covariant in depth (2026-08-10)

`#sec-isobjectsubtype` requires SameTypeWithAssumptions for a writable member
("A writable member is invariant, because covariance there is unsound"). The
engine accepts the subtype:

```js
type MutSrc = { x: uint8 };
type MutTarget = { x: uint8 | string };
Reflect.isAssignable(MutSrc, MutTarget);  // true; spec: false
```

This is exactly the unsoundness the spec's own note names: through the
supertype view a string could be written into a slot the program believes
holds a uint8. Readonly depth covariance (D7's flag) works correctly.

Affected examples: `sec-generic-variance` demonstrates invariance with a
nominal generic, since the structural form is wrongly accepted here. The
depth rule itself has no example until this closes.
## D9 - int64/uint64 values are double-backed, not exact (2026-08-10)

`#sec-integer-types`: the integer types are exact N-bit two's complement, and
`#sec-memory-layout` gives `int64` a 64-bit layout. Past 2^53 the engine
stores the value in a float64 instead:

```js
(1152921504606846976 := int64) === (1152921504606846977 := int64);  // true
String(int64.parse("1152921504606846976"));  // '1152921504606847000'
Number((9007199254740993 := int64) - (9007199254740992 := int64));  // 0
```

Number.isSafeInteger correctly answers false for these, but the stored value
itself has already lost the low bits. Examples avoid printing int64 values
beyond 2^53.

Affected examples: `sec-numeric-predicates` and
`sec-numeric-types-of-this-proposal`, which keep their printed values below
2^53. An exact-64-bit example belongs at `sec-integer-types` once this
closes.
## D10 - Imaginary literals and the complex types are unimplemented (2026-08-10)

`#sec-imaginary-literals` and `#sec-complex-types`:

```js
let z = 3i;              // SyntaxError: Unexpected token
typeof complex64;        // 'undefined'
typeof Math.conj;        // 'undefined'
```

The imaginary literal does not lex and the complex type objects are absent. The engine's own suite documents this as
an open gap (type-universe/extended-numeric-types.test.mts: "the `complex`
type, and the imaginary literal remain refusals, documents the gap"). The
sec-complex-types example ships the refusal, labeled, so the tree reflects
the current state; sec-imaginary-literals shares the entry.

## D11 - (spec) Variance declarations have semantics but no grammar (2026-08-10)

`#sec-generic-variance` states what a variance declaration means ("A type
parameter may be declared covariant or contravariant, as it may in C# and
Kotlin") and defines the polarity well-formedness rules, but the
TypeParameter production of `#sec-type-parameters` is
`BindingIdentifier TypeParameterConstraint? TypeParameterDefault?` - there is
no spelling that declares the variance. 
```js
interface Producer<out T> { get(): T; }
// SyntaxError: Unexpected token - correctly so; no production admits it
```

The engine refusing `out T` / `in T` is consistent with the grammar as
written; the gap is on the spec side. The sec-generic-variance example demonstrates the invariance default,
which is expressible.

Note for D8 while it is open: the wrongful writable-depth covariance reaches
structural generic applications too - `SBox.<uint8>` is accepted where
`SBox.<uint8 | string>` is required for `type SBox<T> = { value: T }` -
so nominal generics are the reliable way to demonstrate invariance.

## D12 - A literal written through a typed ref parameter untypes the binding (2026-08-10)

`#sec-literal-propagation`: a literal takes the type its position requires,
and a `ref x: uint8` parameter is such a position
(`#sec-reference-parameters-and-arguments`). The engine stores a plain Number
instead, which then breaks the caller's binding's own invariant:

```js
function f(ref x: uint8) { x = 2; }
let v: uint8 = 1;
f(ref v);
v instanceof uint8;   // false; v now holds an untyped 2
f(ref v);             // TypeError: the argument bound by ref to "x" does
                      // not satisfy its type annotation
```

Writing an already-typed value (`x = (2 := uint8)`) round-trips correctly;
the chapter example uses that spelling and cites this entry.

Affected examples: `sec-references-and-borrowing`, which writes an already-typed
value through the ref.
## D13 - The replacement pipeline cannot execute end to end (2026-08-10)

`#sec-expansion` and `#sec-applyreplacementdecorator`. Two stacked failures,
found evaluating what the engine's own expansion tests only compile. First,
expansion does not consume the replacement-decorator invocation: the expanded module still contains `@a ...` even when the macro
replaced the decorated tokens entirely. Second, evaluating that leftover
reads the preprocessor import's binding, which was created but never
initialized, and the engine dies on a HOST assertion (GetBindingValue:
`S === Value.true`) rather than raising any guest error:

```js
defineModule("macros.js", 'export function id(t) { return t; }');
defineModule("main.js",
  'import { id } from "macros.js" with { preprocessor: "true" };\n@id class C {}');
import("main.js");   // AssertError: S === Value.true (host crash)
```

The crash is the same when the macro removes the class outright, so the
leftover decorator is the trigger. decorators/expansion.test.mts masks the
first failure by slicing its output at the first `class` and never
evaluating. Because playing such an example would kill the playground
worker, the six pipeline sections (replacement-decorators,
replacementdecoratornames, expansion, when-expansion-happens,
applyreplacementdecorator, syntax-replacement) demonstrate their machinery
on the working substrate instead and cite this entry; loading a
preprocessor module without applying its macros works and is what
sec-preprocessor-modules ships.

## D14 - Getter shape retrieval returns the setter for a shared name (2026-08-10)

`#sec-retrieval-overloaded-targets`: the shape parameter decides which of
several same-named members a retrieval answers. With a getter and a setter
sharing one name, asking for the getter answers the setter:

```js
class A { get v(): uint8 { return 1; } set v(x: uint8) {} }
Reflect.getReflection.<Reflect.ClassGetter, A>("v").kind;  // 'ClassSetter'
```

Getter-only and setter-only classes answer correctly (the suite tests only
those), so this is last-wins where shape-filtering is specified. The
retrieval example uses distinct members and cites this entry.

Affected examples: `sec-retrieval-overloaded-targets`, which asks about a
method and a getter on different names.
## D15 - A deferred application is not usable as a binding's type (2026-08-10)

`#sec-deferred-applications`: an application over an unbound parameter is
carried as an ~application~ Type Record and evaluated at specialization. In an
alias at top level this works (`type P8 = pairOf(uint8)` interns equal to
`[uint8, uint8]`), but annotating a binding inside a generic body with one
fails at the annotation:

```js
function pairOf(T) { return Reflect.makeType({ kind: "tuple",
  elements: [{ type: T, rest: false }, { type: T, rest: false }] }); }
function make<T>(x: T) { let p: pairOf(T); return p; }
make((1 := uint8));   // TypeError: Cannot convert undefined to object
```

The sec-deferred-applications example uses the closed alias form.

## D16 - Object literal freshness is not enforced (2026-08-10)

`#sec-literal-freshness`: "an own property the expected type neither declares
nor admits through an index signature is a type error, reported against the
property". The engine accepts the extra property, at a binding and at an
argument:

```js
type Expected = { x: uint8 };
let bad: Expected = { x: 1, extra: 2 };   // accepted; bad.extra is 2
function f(p: Expected) { return "took it"; }
f({ x: 1, extra: 9 });                    // accepted
```

Width subtyping makes this sound for a value that already has a type; the
freshness rule is specifically about the literal, which is what is missing.

Affected examples: `sec-literal-freshness`, which currently shows only the
accepted-and-correct case. The refusal is the example this section wants.
## D17 - Declarative checker facts are unimplemented (2026-08-10)

`#sec-declarative-checker-facts` gives a Signature Record two further fields:
[[ThisType]] (`#sec-this-adoption`) and [[Narrows]]
(`#sec-declared-narrowing`). The engine's signature records carry neither,
through reflection or through makeType:

```js
type F = (x: uint8) => boolean;
Object.keys(Reflect.getReflection(F).signatures[0]);  // ['parameters','return']
```

The clause is explicit that no dedicated syntax exists ("Deriving the two from
[[Return]] is why no `asserts` operator appears here") and that a signature
"acquires them by construction, which is how the design's `withThisType`
writes one" - and that standard-kit function is absent too, so there is no
route to a signature carrying either fact. A consequence is visible at
`#sec-this-adoption`: extracting a method should be a type error at the
boundary that took it, and instead fails inside the body when it reads a
typed field off undefined.

Affected examples: all three sections of the chapter ship what the engine can
do instead - `sec-declarative-checker-facts` prints the two fields a signature
actually has, `sec-this-adoption` shows the extraction failing late, and
`sec-declared-narrowing` uses the built-in `is` test. All three want rewriting
once a signature can carry the facts.

## D18 - Parameterized primitive families are not bound in expression position (2026-08-10)

`#sec-types-in-expression-position`: "A type name is already an expression,
since a type is a value, so `uint8` and `Map.<string, uint8>` may be written
where a value is expected." The named shorthands and the generic classes obey
this; the parameterized primitive families do not, because their bases are not
bindings at all:

```js
typeof uint8;      // 'object'   - shorthand, fine
typeof Map;        // 'function' - generic class, fine
typeof int;        // 'undefined'  \
typeof uint;       // 'undefined'   } no binding for the family base,
typeof vector;     // 'undefined'   } so a parameterized reference cannot
typeof complex;    // 'undefined'  /  resolve in expression position
int.<8> === int8;  // ReferenceError: "int" is not defined
typeof uint.<4>;   // 'undefined'
```

Type position is unaffected (`type B = int.<8>` interns equal to `int8`, and
`type V = vector.<float32, 4>` equals `float32x4`), and a metadata
parameterization of a shorthand works (`typeof float64.<{ m: 1 }>` is
'object') because its base is bound. So the gap is exactly the family bases.

Affected examples (both use the alias form and should use the direct
expression once this is fixed): `sec-canonicalizetype`, and any future
example wanting `int.<N>`/`uint.<N>`/`vector.<T, N>` as a value.

## D19 - ThreadLocal storage does not default to DefaultValueOf(T) (2026-08-10)

`#sec-threadlocal-objects`: "An agent that has not written the storage reads
DefaultValueOf(_T_)". The engine reads undefined instead, and a written value
comes back untyped:

```js
const t = new ThreadLocal.<uint32>();
t.value;               // undefined; spec: 0 (typed)
new ThreadLocal.<string>().value;  // undefined; spec: ''
t.value = 5; t.value;  // 5, untyped
```

DefaultValueOf itself is correct for ordinary bindings (`let d: uint32` reads
`0 (typed)`), so this is the ThreadLocal storage path specifically. Compare D4,
which is DefaultValueOf's other gap.

Affected examples: `sec-threadlocal-objects`, which writes before reading.
Restore the read-before-write line when this closes.

## D22 - (spec) DefaultValueOf's parameterized step can return a non-member (2026-08-11)

`#sec-defaultvalueof` returns "either a value of the type _t_ or ~none~", but
its parameterized step checks only the validation judgment: "If the metadata's
meta type defines a validation judgment and that judgment does not hold of _d_
and _t_.[[Metadata]], return ~none~. Return _d_."

Where a governing meta type constrains and defines no `validate` - a brand -
there is no validation judgment to fail, so the step returns the base's zero.
That value is not of the parameterization: `#sec-primitive-metadata` says such
a meta type "admits NO bare value of the base, which is what makes a brand a
brand". The step therefore contradicts the operation's own return contract, and
a binding given that default is then refused by its own annotation.

```js
type M = { m: number };
meta M { default = { m: 0 }; subtype(a, b) { return true; } }   // no validate
type Meter = float64.<{ m: 1 }>;
let d: Meter;   // step 12 as written yields 0, which is not a Meter
```

The engine tests membership instead, which subsumes the judgment and honours
the contract, so a brand's parameterization has no default. Suggested wording
for the step: "If _d_ is not a value of the type _t_, return ~none~."

## D23 - float128 has no value representation (2026-08-11)

`#sec-binary-floating-point-types` gives `float16`, `float32`, `float64` and
`float128` values "of the corresponding IEEE 754-2019 binary interchange
formats", and `#table-binary-float-types` gives float128 its width and
precision. The type object exists and can be annotated with, but no value of it
can be made by any route:

```js
let x: float128 = 1.5;   // TypeError: "a literal type of number" is not
                         //            assignable to "float128"
(1.5 := float128);       // TypeError: 1.5 is not assignable to "float128"
float128(1.5);           // the same
let f: float128;         // undefined - it has no zero either, since there is
                         // no value to be the zero
```

This is a completeness gap rather than a behavioural divergence, and the
specification expects implementations to differ here: "Coverage is not
conditioned on which types an implementation has values for: the `float128` and
decimal rows are as normative as the rest." The decimal families do have values,
so this is float128 alone among the binary floats, and it is the sibling of D10
rather than of the defaulting entries.

Affected examples: none. The engine suite's `sec-defaultvalueof` test pins
`let f: float128;` as undefined and cites this entry, so the gap is recorded
rather than read as an oversight in the defaulting rule.

## D24 - A specialized generic's field type is not substituted (2026-08-11)

`#sec-generic-specialization` makes each application a distinct type, and a
field declared at a parameter should hold the argument's type once the
parameter is bound. The engine substitutes a METHOD's parameter types and
leaves the FIELD's alone, so the field is both undefaulted and unchecked:

```js
class Box<T> { value: T; set(v: T) { this.value = v; } }
const b = new Box.<uint8>();
b.value = "a string";   // ACCEPTED - the field's type is still the unbound
                        // parameter, so nothing checks it
b.value = 5;
b.value is uint8;       // false - not even converted
new Box.<uint8>().value;   // undefined, where a uint8 field reads 0
b.set("a string");      // correctly refused: method parameters DO substitute
```

Two consequences beyond the unsoundness. `DefaultValueOf`'s ~parameter~ case
answers ~none~ deliberately - its comment records that answering otherwise made
a field of a parameter type report "undefined is not assignable to parameter"
for a declaration a concrete type accepts - and that workaround is only
necessary because the parameter is still there at specialization. And the
no-default refusal (formerly D21) exempts ~parameter~ for the same reason: there
is no point at which the bound type could be checked. **The exemption lifts when
this closes**, and the exemption's comment says so at
`src/type-system/runtime.mts` and the two declaration sites.

Affected examples: none - the tree has no example of a generic class field.
Add one to `sec-generic-specialization` when this closes.

## D25 - A `var` binding does not take its type's default (2026-08-11)

`#sec-defaultvalueof` answers "the value a binding or a field of the type _t_
holds before it is assigned", and `#sec-declarations` draws no distinction among
the declaration forms. A `var` gets neither the default nor, consequently, the
refusal that follows it:

```js
var v: uint8;            // undefined
let l: uint8;            // 0 (typed)
var u: uint8 | string;   // declared, and holds undefined
let w: uint8 | string;   // a type error - the type has no default
```

`Evaluate_VariableDeclaration` returns early when there is no initializer, so
the annotation is never consulted. Fixing it is the same two lookups the `let`
path performs, but it is a behaviour change of its own - every annotated `var`
without an initializer starts holding a value where it held *undefined* - so it
is filed rather than folded into the refusal work.

Affected examples: none. The engine suite's typed-bindings tests pin both halves
of the asymmetry and cite this entry.
