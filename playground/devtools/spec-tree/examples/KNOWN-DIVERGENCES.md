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
| D3 | Function-type operand of the `type` operator is unwritable | engine | sec-types-in-expression-position |
| D4 | Tuple bindings have no default value | engine | sec-defaultvalueof |
| D5 | Unary `+` strips the numeric type | engine | sec-unary-operators-for-typed-values |
| D6 | Object type identity is member-order-sensitive | engine | sec-sameobjecttype |
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

## D3 - The function-type operand of the `type` operator is unwritable (2026-08-09, rescoped 2026-08-11)

`#sec-types-in-expression-position` motivates its cover grammar with exactly
this case: "`type (uint8) => uint8` is a type operator applied to a function
type, while `type (x)` is a call of a function named `type`, and the two agree
until the token after the closing parenthesis. This specification resolves it
with a cover grammar ... the parenthesized text is parsed under a cover
production and refined to a function-type operand or a call argument list once
the token after the closing parenthesis is known."

The engine has no cover production, so `(` is always a call and the operand is
refused:

```js
type (uint8) => uint8;      // SyntaxError: Unexpected token
type (x: uint8) => uint8;   // SyntaxError: Unexpected token
type F = (x: uint8) => uint8;   // the alias form works, and is what
                                // examples use
```

Fixing it means parsing the parenthesized text once and refining on the token
after `)`, the device the grammar already uses for arrow parameters and for
`async (`.

**This entry previously claimed `type (uint8 | string)` should work.** It
should not: the cover production refines to a function-type operand or a call
argument list, and a parenthesized non-function type is neither. The clause
also says the operand "extends as far as one reaches: `type A | B` is the union
of `A` and `B`", so the union spelling is unparenthesized - and it already
works, `(type uint8 | string) === U` being *true*. The parenthesized union is a
call, correctly.

Affected examples: `sec-types-in-expression-position` demonstrates the object,
tuple and union operands and notes the function type. Add the function-type
operand there when this closes.

## D4 - Tuple bindings have no default value (2026-08-10)

`#sec-defaultvalueof` builds a tuple default element-wise: for
`[uint8, uint8]` every element type has a default (0), so the binding should
hold a new `[0, 0]` tuple before assignment. The engine leaves it undefined:

```js
let t: [uint8, uint8];
t;                       // undefined; spec: a typed [0, 0]
let a: [].<uint8>; a;    // [] - the dynamic-array case is correct
let d: uint8; d;         // 0 - the numeric case is correct
```

The `#sec-defaultvalueof` example uses the array and boolean cases and notes
this entry for tuples.

## D5 - Unary + strips the numeric type (2026-08-10)

`#sec-unary-operators-for-typed-values`: "Unary `+` returns its operand
unchanged when the operand is a value of a numeric type of this proposal."
The engine converts to a plain Number instead:

```js
Reflect.typeOf(+(7 := uint8)) === number;  // true; spec: uint8, unchanged
```

Unary `-` and `~` behave as specified (wrapping). The unary-operators example
demonstrates those two and cites this entry.

Affected examples: `sec-unary-operators-for-typed-values`, which demonstrates
`-` and `~` only. Add the unary `+` line when this closes.
## D6 - Object type identity is member-order-sensitive (2026-08-10)

`#sec-sameobjecttype` looks a property up in the other record by [[Key]], so
member order does not participate in identity, and interning should make two
orderings one Type Object. The engine compares positionally:

```js
type A = { x: uint8, y: string };
type B = { y: string, x: uint8 };
A === B;                          // false; spec: true
Reflect.isAssignable(A, B) &&
Reflect.isAssignable(B, A);       // true - assignability is order-insensitive,
                                  // so the divergence is identity/interning only
```

The sameobjecttype example uses an optionality difference (correctly false)
and cites this entry.

Affected examples: `sec-sameobjecttype`, which distinguishes types by
optionality instead of by member order.
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
