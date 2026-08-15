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
| D13 | Replacement pipeline cannot execute end to end | engine | six sec-decorators pipeline sections |
| D17 | Declared narrowing, this-adoption and a method's expected this | engine | sec-declarative-checker-facts |
| D26 | IsSubtype has no nominal arm | engine | sec-issubtype |
| D29 | (spec) Tuple covariance is stated without a store rule | **spec** | sec-issubtype |
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

## D13 - A replacement decorator applies again at run time (2026-08-10, rediagnosed 2026-08-14)

`#sec-expansion` consumes a replacement-decorator invocation, and
`#sec-applyreplacementdecorator` runs the macro once, at expansion. In this host
the decoration survives into the evaluated module and applies a SECOND time as
an ordinary class decorator, whose return replaces the class:

```js
defineModule("macros.js", 'export function keep(t) { return t; }');
defineModule("main.js",
  'import { keep } from "macros.js" with { preprocessor: "true" };\n'
  + '@keep class C { x = 1; }\nglobalThis.built = new C().x;');
await import("main.js");        // TypeError: [object Object] is not a constructor
                                // typeof C is 'object' - the macro's return
                                // replaced the class
```

**The entry previously said something else, and both halves were wrong.** It
recorded that expansion leaves `@a` in the expanded source and that evaluating
the leftover reads the preprocessor import's uninitialized binding, killing the
host on `GetBindingValue: S === Value.true`.

The host crash was real and is fixed, but it was not this feature's: the binding
read was `C`, the class, and `class C {}` alone in a module - no preprocessor, no
decorator - crashed the same way. `Evaluate_ClassDeclaration` resolved the
class's own name without saying the read was strict. That is fixed separately,
and with it gone the pipeline reaches the guest error above.

Whether expansion consumes the decorator depends on the host resolving the
macro: supplying `HostResolveReplacementDecorator` directly, the expanded source
is clean and carries no `@keep`. Through the module loader the decoration
survives - so the next step is why the hook does not resolve a macro imported by
a preprocessor import, which is a narrower question than the entry posed.

Affected examples: the six pipeline sections - `replacement-decorators`,
`replacementdecoratornames`, `expansion`, `when-expansion-happens`,
`applyreplacementdecorator`, `syntax-replacement` - demonstrate on the working
substrate and cite this entry. They can be restored once a macro applies once.
Playing such an example no longer kills the worker, which was the reason they
could not be attempted.

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

The recursion hazard turns out NOT to be the obstacle, and the design question
answers itself once the clause's sentence is split in two. Adoption is defined
only "where a non-arrow function literal's contextual type is a ~function~ type
whose applicable signature has a [[ThisType]]" - and that type is fully built by
then, since `#sec-compile-time-evaluability` requires "the type is built first
and the literal is checked against it". So a frame carries a `this` type ONLY
where a literal adopted one, class bodies keep `this` untyped exactly as today,
and nothing is computed while it is being asked for. Building it that way -
frame field, adoption recorded at the contextual position, a `ThisExpression`
arm in `staticType` - is straightforward and was done.

**What stops it is the same gap as D31 and D32.** A function literal never
RECEIVES a contextual type. Measured in one program: a `NumericLiteral` at a
typed position is offered its contextual type and a `FunctionExpression` at an
annotated binding is offered nothing, so the adoption never fires however
correctly the frame is wired.

That unifies three entries. D31 (an alias-typed parameter gets no contextual
type at a call), D32 (a function literal argument is not checked against the
parameter's type) and this are one underlying gap: **contextual typing does not
reach function literals**. Closing that unblocks all three, and none of them can
be closed without it.

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

