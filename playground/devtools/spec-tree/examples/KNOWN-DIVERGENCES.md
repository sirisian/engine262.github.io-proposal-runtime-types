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
| D8 | Writable members are wrongly covariant in depth | engine | sec-generic-variance (nominal form used) |
| D9 | int64/uint64 are double-backed, not exact | engine | sec-numeric-predicates, sec-numeric-types-of-this-proposal |
| D10 | The complex operators and Math overloads are an extension obligation | **spec** | sec-extension-hooks |
| D11 | Variance declarations have semantics but no grammar | **spec** | sec-generic-variance |
| D13 | Replacement pipeline cannot execute end to end | engine | six sec-decorators pipeline sections |
| D31 | An alias-typed parameter receives no contextual type at a call | engine | sec-literal-propagation |
| D32 | A function literal argument is not checked against the parameter's type | engine | sec-check-insertion |
| D17 | Declared narrowing, this-adoption and a method's expected this | engine | sec-declarative-checker-facts |
| D18 | Parameterized primitive families unbound in expression position | engine | sec-canonicalizetype |
| D19 | ThreadLocal storage does not default to DefaultValueOf(T) | engine | sec-threadlocal-objects |
| D23 | float128 has no value representation | engine | sec-binary-floating-point-types |
| D24 | A specialized generic's field type is not substituted | engine | sec-generic-specialization |
| D25 | A `var` binding does not take its type's default | engine | sec-defaultvalueof |
| D26 | IsSubtype has no nominal arm | engine | sec-issubtype |
| D27 | A boundary converts a numeric to a String implicitly | engine | sec-the-conversion-rule |
| D28 | Deleting a tuple position is not refused | engine | sec-array-defaults-and-stores |
| D29 | (spec) Tuple covariance is stated without a store rule | **spec** | sec-issubtype |
| D30 | Shift operators use 32-bit semantics above width 32 | engine | sec-integer-operations |
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
holds a uint8.

The readonly half of the depth rule is now enforced: a write through a
`readonly` member is refused, so its covariance is sound for the reason the
clause gives. This entry is the other half - a WRITABLE member is not invariant
- and closing the first did not close it.

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

Three consequences the original entry missed, each found by sweeping every
operation over a wide type:

```js
int64.parse("9223372036854775807");   // RangeError - a type cannot parse its
uint64.parse("18446744073709551615"); // RangeError   OWN MAXIMUM, since the
                                      //              range check rounds first
(18014398509481983 := uint.<54>);     // 0 - the wrap is computed AFTER the
                                      //     rounding, so 2^54 - 1 becomes 2^54
9007199254740993n := int64;           // TypeError, and int64(x) likewise, so no
                                      // route admits an exact wide value at all
Math.clz((1 := uint64));              // 64, where uint.<40> correctly gives 39
```

The scope is every width above 53, not the named ones: `#sec-integer-types`
admits _N_ up to 2^16, and `uint.<54>` and `uint.<200>` are as affected as
`int64`. Stage 1 of the fix has landed - the carrier is now `number | bigint`
and `Number.isSafeInteger` reads it exactly - and the engine's tests pin each
line above so the remaining stages have their targets.

Affected examples: `sec-numeric-predicates` and
`sec-numeric-types-of-this-proposal`, which keep their printed values below
2^53. An exact-64-bit example belongs at `sec-integer-types` once this
closes.
## D10 - The complex operators and Math overloads are an extension obligation (2026-08-10, rescoped 2026-08-12)

The imaginary literal, the complex types, their conversions and their layout are
implemented. What remains is not an engine defect but an outward obligation, and
`#sec-extension-hooks` says so of itself: it "lists the extensions the preceding
clauses name and what each is relied on for. **It is a map of the obligations
this specification has incurred outward, not a specification of the extensions
themselves.**" Its complex row divides the work:

> **complex numbers** - The operators and `Math` overloads of the complex types.
> The type of an imaginary literal and the conversions are delivered by
> `#sec-complex-numbers`.

So the document delivers the type, the literal and the conversions - all now in
the engine - and defers the arithmetic:

```js
4i                                   // complex(0, 4)
complex(3, -4).toString()            // '3-4i'
let z: complex;                      // 0i - the zero D20 could not give
(type complex64) === (type complex.<float32>)   // true
complex64(complex(0.1, 0)).real      // 0.10000000149011612 - componentwise
(type complex128).byteLength         // 16 - a pair of float64
complex(1, 2) + complex(3, 4)        // still unsupported
Math.conj, Math.arg                  // still absent
```

The constraint the deferred half must satisfy IS written down, which is what
makes this closable rather than open-ended.
`#sec-which-operations-each-family-defines` gives the complex family
`unaryMinus, exponentiate, multiply, divide, add, subtract, equal, sameValue,
sameValueZero, toString`, and denies it `lessThan` "since the complex numbers
are not ordered", `remainder`, and the bitwise and shift operations. The
operator table adds that a binary operator returns the operand type and that
comparison is "equality only". `#sec-numeric-library` says `Math.abs` of a
`complex.<T>` is "the real magnitude, a value of _T_", that "`Math.conj` and
`Math.arg` are its additions", and that the predicates are componentwise, which
the engine implements already.

What an implementer needs and does not have is the SEMANTICS of the five
arithmetic operations. They are the ordinary ones, so this is a small gap in
practice; it is recorded because the document is not their source, and an
implementer who reads the entry as an engine defect will look for them here and
not find them.

Affected examples: `sec-complex-types`, `sec-imaginary-literals` and
`sec-complex-numbers` show the literal, the pair, and what the extension still
owes.

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

## D17 - Declared narrowing, `this` adoption, and a method's expected `this` (2026-08-10, rescoped 2026-08-13)

`#sec-declarative-checker-facts` gives a Signature Record two fields:
[[ThisType]] (`#sec-this-adoption`) and [[Narrows]] (`#sec-declared-narrowing`).

**[[ThisType]] exists and now means something.** It is constructible through
`Reflect.makeType`, reflected, part of a function type's identity, and
contravariant as the clause requires - so a method put where a free function is
expected is refused at the boundary that took it. The original entry reported
the field as absent on the evidence of a SOURCE-written function type, which has
no spelling for it: "Neither [[ThisType]] nor [[Narrows]] has a source spelling.
A signature acquires them by construction."

Three things remain.

**1. A method's expected `this` - CLOSED.** A method now carries one, and the
extraction is refused at the boundary that took it rather than failing inside
the body.

Which type it expects was the design question, and it was settled by
elimination. Giving a class's method the CLASS was tried and refuses
`class C implements I`: the class's method would expect a `C` where the
interface's expects an `I`, and `C` is the narrower, which contravariance
rejects. The premise is wrong - a method is reached only through an object that
HAS it, so the receiver is a `C` at every call whether the reference is typed
`C` or `I`. A method's `this` is the RECEIVER rather than a fixed type, so every
method carries the same self marker: two methods agree on it, a method and a
free function do not.

Worth recording that the wrong direction passed 2700 of 2701 tests. No test
covered `class C implements I` with a method, so the suite could not eliminate
it; the criteria did.

**2. No contextual adoption**, and it needs a mechanism the checker does not
have. "Where a non-arrow function literal's contextual type is a ~function~
type whose applicable signature has a [[ThisType]], the literal adopts it:
`this` within the body has that type."

Adoption is a statement about the TYPE OF `this` inside a body, and this checker
never gives `this` a static type - not even inside a class method, where the
code says so deliberately: "`this.x` and `super.x` are inside by construction,
and asking for the receiver's type there would recurse into the class being
defined." Measured rather than assumed: inside a literal at a contextual type
carrying a `this`, `let s: string = this.x` is accepted where `x` is a `uint8`,
so `this` is untyped there.

So this is not a hook to fill but a frame-level `this` type to introduce, with
the recursion hazard the existing comment names. That is a design decision
rather than an implementation gap.

Attempting 1 established two things worth recording, since they bound what a
fix can achieve:

- **A class method cannot carry a [[ThisType]] alone.** Giving one refuses the
  extraction correctly, and breaks `class C implements I`: the class's method
  then has a `this` and the interface's does not, which the variance rule
  refuses by construction. An interface method and an object-type method need
  one too, and what `this` each expects is a design question rather than a
  filled field. The full suite did NOT catch this - 2700 of 2701 passed - and it
  was found by testing the case directly.
- **The variance rule is currently observable only through
  `Reflect.isAssignable`.** No source boundary consults a function type against
  a function LITERAL: `function h(f: (x: uint8) => uint8) {}` accepts
  `h((x) => "wrong")`, inline or through an alias, while a BOUND function of the
  wrong type is refused. So a `this` mismatch cannot be produced from source
  until either a class method carries one or the literal case is checked.

**3. [[Narrows]] is absent in full.** A `narrows` field on a constructed
signature is dropped:

```js
Reflect.makeType({ kind: "function", signatures: [{ parameters: [{ name: "v", type: any }],
  return: { type: boolean }, narrows: [{ target: "v", type: uint8 }] }] });
// reflected signature: parameters, return
```

The DATA half has landed: a signature carries [[Narrows]], constructs and
reflects it, it is part of the signature's identity, and a non-empty [[Narrows]]
on a signature returning anything but `boolean` or ~void~ is refused where it is
built. What remains is the CONSUMPTION.

Both forms follow from [[Return]]: a `boolean` return narrows where the call is
true, "exactly as `v is T` applies"; a ~void~ return narrows in every position
the call dominates.

Two attempts at the `boolean` form narrowed the difficulty to one thing, which
is worth recording so a third does not repeat them.

**The guard type reaches the checker.** `#sec-compile-time-evaluability` confines
evaluation to what "reads declarations rather than run-time bindings", and a
CALL "resolves through imports to a function declaration, whose body these
semantics interpret" - so the alias must be written as a call:

```js
function makeGuard() { return Reflect.makeType({ ... narrows: [...] }); }
type Guard = makeGuard();      // statically resolved
let bad: Guard = (5 := uint8); // refused BEFORE anything runs

const Held = Reflect.makeType({ ... });
type Alias = Held;             // a run-time BINDING - invisible to the checker
let v: Alias = anything;       // accepted; the check happens at run time
```

That distinction is the clause's, not an engine artefact, and it is easy to get
wrong: the binding form looks identical and silently degrades to a run-time
check.

**What blocks the consumption is the callee lookup.** `narrowingFactOf` is the
right hook - it turns a test into a `{ name, type, negated }` fact, and the
machinery that carries an `is` test through both branches carries anything it
returns. A call arm added there never fires, because neither `staticType` nor
`lookupDeclared` yields the callee's function type at that point, for a `const`
binding OR for a parameter, though both are annotated with a resolvable `Guard`.
The control passes in the identical shape - `if (box is uint8)` narrows a
`uint8 | string` correctly - so the hook and the test shape are right.

The likely resolution is the OTHER mechanism beside it: `walkGuarded` also
builds a narrowing REQUEST, and its comment says that pass "can call `narrow`
where this pass cannot". Declared narrowing probably belongs there rather than
in the fact pass.

`withThisType` is absent too, but it belongs to the standard kit - some seventy
type-level functions - and the clause calls it three lines given a constructible
field, which there now is.

Affected examples: `sec-this-adoption` shows the extraction failing late and
`sec-declared-narrowing` uses the built-in `is` test. Both want rewriting as the
remaining pieces land.

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

A deferred application in a field is the shape a program is most likely to meet
this through, and the error names the parameter rather than the gap:

```js
function pairOf(T) { return Reflect.makeType({ kind: "tuple",
  elements: [{ type: T, rest: false }, { type: T, rest: false }] }); }
class Box<T> { p: pairOf(T); }
new Box.<uint8>();
// TypeError: "[T, T]" has no default value, so a declaration of it needs
//            an initializer
```

`#sec-deferred-applications` works everywhere the parameter IS bound - a
binding, a parameter, a return, and nested inside itself, all inside a generic
body - so a field is the one position that fails, and it fails for this entry's
reason. The rule reporting it is the one that refuses a declaration whose type
has no default; that rule is doing its job on a type this gap left
unsubstituted.

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

## D26 - IsSubtype has no nominal arm (2026-08-12)

`#sec-issubtype` states that "a ~nominal~ type is a subtype along its declared
inheritance", and `#sec-object-types` gives an interface a structural form
precisely so that "a value satisfy an interface by having its members". Neither
holds: only an IDENTICAL nominal answers *true*, plus the arms implemented
separately (`any`, `never`, and an enum to its underlying type).

```js
class Base { a: uint8; }  class Derived extends Base { b: uint8; }
Reflect.isAssignable(type Derived, type Base);        // false; spec: true
new Derived() instanceof (type Base);                 // true - membership is fine
let b: Base = new Derived();                          // accepted - the boundary
                                                      // uses membership

interface I { a: string }
Reflect.isAssignable(type { a: string }, type I);     // false; spec: true
class Impl implements I { a: string; }
Reflect.isAssignable(type Impl, type I);              // false; spec: true
```

Everything derived from the missing arm inherits it. Each of these answers *no*
where the clause answers yes:

```js
type FB = (x: Base) => void;  type FD = (x: Derived) => void;
Reflect.isAssignable(FB, FD);                             // contravariance
Reflect.isAssignable(type { readonly v: Derived },
                     type { readonly v: Base });          // readonly depth
```

Not unsound - it is a false *no*, so it refuses questions rather than admitting
values, and the boundaries use membership and are unaffected. But
`Reflect.isAssignable` is user-facing reflection, and a program asking whether a
subclass may stand in for its base gets the wrong answer.

Affected examples: none - the tree has no example of nominal subtyping. Add one
to `sec-issubtype` when this closes.

## D27 - A boundary converts a numeric to a String implicitly (2026-08-12)

`#sec-the-conversion-rule`: a primitive type is assignable only to itself and
`any`, and `string(x)` is the explicit spelling for the conversion. At a
run-time boundary the conversion happens anyway:

```js
let boxed: any = (1 := uint8);
let s: string = boxed;              // '1' - a String; spec: a type error
let a: [].<string> = ["x"];
let loose: any = a;
loose[0] = (1 := uint8);            // a[0] is '1'
type T = [uint8, string];
let t: T = [1, "s"];
t[1] = (1 := uint8);                // t[1] is '1'
```

The checker refuses the same assignment where the type is known -
`let s: string = (1 := uint8);` is an early error - so this is the run-time half
of the rule disagreeing with the static half. `RequireType` reaches
`CheckedConvertValue`, whose primitive branch applies the explicit conversion,
and every boundary that calls it inherits the behaviour: a binding, an array
element store, a tuple position store, and a field.

Affected examples: none. The engine suite pins the tuple and array forms and
cites this entry.

## D28 - Deleting a tuple position is not refused (2026-08-12)

`#sec-array-defaults-and-stores`: "Deleting an element of a typed array throws a
*TypeError* exception." A tuple is an array whose positions are typed, and a
delete succeeds:

```js
type T = [uint8, string];
let t: T = [1, "s"];
delete t[0];        // true; the tuple now has a hole where a uint8 was declared
```

The store rule for a tuple position now exists; the delete rule does not, and it
is the same sentence's other half.

Affected examples: none. The engine suite pins it and cites this entry.

## D29 - (spec) Tuple covariance is stated without a store rule (2026-08-12)

`#sec-issubtype` records "a ~tuple~ is covariant position-wise" one line from
"an ~array~ is invariant in its element", for the same underlying mutable Array.
The array's invariance is justified in the same paragraph the object's is:
covariance through a mutable position is unsound. A tuple is exactly as mutable,
and `#sec-array-defaults-and-stores` states a store rule only for "an array of
element type _t_" - a rule about an ~array~ record's single [[Element]], not
about a ~tuple~ record's per-position [[Elements]].

So the specification permits the exploit the engine had:

```js
type TupN = [uint8];  type TupW = [uint8 | string];
let narrow: TupN = [1];
let wide: TupW = narrow;   // permitted by the covariance
wide[0] = "a string";      // nothing in the specification refuses this
narrow[0];                 // a String in a slot declared uint8
```

Two ways to close it. **Preferred: state the store rule for a tuple**, which
makes the covariance backstopped exactly as `[].<any>` is - the engine now does
this. The alternative is to make a tuple invariant position-wise like an array,
which is simpler but loses what the membership clause clearly wants, since a
shorter tuple satisfying a longer one's read positions is the point of the
covariance.

While this is open, a conforming implementation without the store rule is
unsound and the specification does not say so.

## D30 - Shift operators use 32-bit semantics above width 32 (2026-08-12)

`#sec-integer-operations` gives each integer type the operations of its family
at its own width. The shifts are performed with JavaScript's 32-bit semantics
instead, so a shift distance is taken modulo 32 and the result is computed in
32 bits:

```js
(1 := uint64) << (40 := uint64);        // 256   - 40 mod 32 = 8
(1 := uint64) << (33 := uint64);        // 2     - 33 mod 32 = 1
(1 := uint.<33>) << (32 := uint.<33>);  // 1     - and 2^32 IS exact in a double
(1 := uint32) << (31 := uint32);        // 2147483648 - correct
```

Separate from D9 despite looking like it, and the `uint.<33>` line is the proof:
2^32 is exactly representable in a float64, so the exactness work does not reach
this. The defect belongs to the operator rather than to the value, and the fix
is to shift at the type's own width with the distance taken modulo that width.

Affected examples: none. The engine suite pins both this and D9's `clz` beside
each other, since the widths at which they fail are what tell the two apart.

## D31 - An alias-typed parameter receives no contextual type at a call (2026-08-12)

`#sec-literal-propagation`: a literal takes the type its position requires, and
a parameter is such a position. Where the parameter's annotation is written
INLINE this holds; where it names an alias, no contextual type reaches the
argument at all, so every rule that depends on one is skipped and the error
falls through to the run-time boundary:

```js
function inline(p: uint8) {}
inline(300);          // TypeError at CHECK time: "a literal type of number is
                      // not assignable to uint.<8>"

type U = uint8;
function alias(p: U) {}
alias(300);           // RangeError at RUN time, from inside `alias`

type E = { x: uint8 };
function obj(p: E) {}
obj({ x: 1, extra: 9 });   // accepted - #sec-literal-freshness never runs,
                           // where the inline spelling refuses it
```

The same alias in a BINDING is unaffected - `let bad: E = { x: 1, extra: 2 }` is
refused - so this is the argument position specifically.

Found while implementing literal freshness, which is the rule whose absence
made it visible: the freshness refusal fires for an inline parameter type and
not for an alias naming the same type. The engine's suite pins both, so the
divergence is recorded at the site that will close it.

Affected examples: none. The `sec-literal-freshness` example uses a binding and
an inline parameter type.

## D32 - A function literal argument is not checked against the parameter's type (2026-08-13)

`#table-check-sites` makes an argument a check site, and a bound function of the
wrong type is refused there. A function LITERAL written at the same position is
not checked at all:

```js
type FN = (x: uint8) => uint8;
function h(f: FN) { return "took it"; }

h((x) => "wrong");                              // accepted
function inline(f: (x: uint8) => uint8) {}
inline((x) => "wrong");                         // accepted - the same either way

const bound: (x: string) => string = (x) => x;
h(bound);                                       // TypeError: "(x: string) =>
                                                // string" is not assignable to
                                                // "(x: uint.<8>) => uint.<8>"
```

So the gap is the LITERAL rather than the position or the spelling - the mirror
of `#sec-literal-freshness`, where an object literal at a typed position gets a
rule of its own. Unlike the object case there is no freshness question here: a
function literal at a function-typed position should simply be checked against
it.

Found while implementing `#sec-this-adoption`, whose variance rule this hides:
with no source boundary consulting a function type against a literal, a `this`
mismatch cannot be produced from source at all, and the rule is observable only
through `Reflect.isAssignable`.

Affected examples: none.
