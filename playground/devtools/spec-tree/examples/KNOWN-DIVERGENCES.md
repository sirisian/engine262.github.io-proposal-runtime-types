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


## D3 - To investigate: parenthesized type after `type` in expression position (2026-08-09)

`(type (uint8 | string))` in expression position appears to parse the
parenthesized part as an ordinary expression (`uint8 | string` as values
numeric-ors to 0). Not yet checked against the `#sec-types-in-expression-position`
grammar; determine whether this spelling is sanctioned before filing. Aliases
(`type U = uint8 | string;` then `U`) work and are what examples use.
