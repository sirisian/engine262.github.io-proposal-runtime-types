# Known engine/spec divergences found while authoring examples

Hand-maintained. Each entry is a construct the specification sanctions that the
engine (lib/engine262 as of the date noted) rejects or mishandles, discovered
while writing tree examples. These are inputs to the feedback loop this
playground exists for: file them against engine262-proposal-runtime-types or
the spec, whichever is wrong, and delete the entry once resolved. Examples
affected by an entry are written with a working alternative spelling and
reference the entry number in a comment; revisit them when the entry closes.

Automated findings (examples that run but print something unexpected) go to
FINDINGS.md, written by scripts/validate-examples.mts. This file is for
constructs that cannot ship as examples at all.

## D1 - Recursive type alias throws ReferenceError (2026-08-09)

`#sec-type-alias-declarations` sanctions self-reference "provided every cycle
passes through a position that holds a reference rather than an inline layout:
a member written `T | null`, ...". The engine throws instead:

```js
type L = { value: uint8, next: L | null };
// ReferenceError: "L" cannot be used before initialization
```

Blocks the natural examples for `#sec-sametypewithassumptions` (assumption
lists exist to terminate exactly this comparison) and part of
`#sec-type-alias-declarations`.

## D2 - The tuple form type [ ... ] in expression position evaluates to undefined (2026-08-09)

The literal form (type 3) and the object form (type { x: uint8 }) evaluate to
their interned Type Objects in expression position; the tuple form evaluates to
undefined, at run time and inside EvaluateBuilderCall alike:

```js
typeof (type 3);              // 'object'
typeof (type { x: uint8 });   // 'object'
typeof (type [uint8]);        // 'undefined'
type T2 = [uint8, uint8];     // the alias form is fine, and
                              // Reflect.makeType tuples intern equal to it
```

Beware vacuous comparisons while this is open: (type [uint8]) === (type
[uint8]) is true because both sides are undefined - String() of the result
printing "undefined" is the tell. Examples use aliases or Reflect.makeType
for tuples in expression position.


## D3 - Parenthesized and bare-union operands of the type operator misparse in expression position (2026-08-09, confirmed 2026-08-10)

Confirmed against the grammar: `#sec-types-in-expression-position` defines
`TypeOperatorExpression : type [no LineTerminator here] Type`, and the Type
production includes parenthesized types (used freely in type position, e.g.
`(uint8 | string) | uint16` in an alias). So `type (uint8 | string)` in
expression position is sanctioned; the engine parses the parenthesized part
as a value expression instead (`uint8 | string` as values numeric-ors to 0,
then the alias reports "0 is not assignable"). Aliases are the working
spelling and are what examples use. Same family as D2's tuple operand.

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

## D9 - int64/uint64 values are double-backed, not exact (2026-08-10)

The integer types are exact N-bit two's complement. Past 2^53 the engine
stores them in a float64:

```js
(1152921504606846976 := int64) === (1152921504606846977 := int64);  // true
String(int64.parse("1152921504606846976"));  // '1152921504606847000'
Number((9007199254740993 := int64) - (9007199254740992 := int64));  // 0
```

Number.isSafeInteger correctly answers false for these, but the stored value
itself has already lost the low bits. Examples avoid printing int64 values
beyond 2^53.

## D10 - Imaginary literals and the complex types are unimplemented (2026-08-10)

`#sec-imaginary-literals` and `#sec-complex-types`: `3i` is a SyntaxError and
the complex type objects are absent. The engine's own suite documents this as
an open gap (type-universe/extended-numeric-types.test.mts: "the `complex`
type, and the imaginary literal remain refusals, documents the gap"). The
sec-complex-types example ships the refusal, labeled, so the tree reflects
the current state; sec-imaginary-literals shares the entry.
