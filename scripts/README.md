# scripts

Everything here already exists. Read this before writing a fourth one.

ISSUES-found-while-writing-examples.md I4: `check-coverage.mts` was in this
directory the whole time a cycle of coverage work was measuring coverage with an
ad-hoc script, because nothing named it. The scripts were reachable only by
knowing the filenames - only `serve` had an npm entry - so the way to find one
was to already know it was there. All three now have entries, and this file says
what each is for.

## The example tree

The specification tree pairs every section of `spec.emu` with runnable examples.
Three scripts keep that pairing honest, and they run in this order:

| Command | Script | What it does |
| --- | --- | --- |
| `pnpm spec:outline` | `generate-spec-outline.mts` | Regenerates `playground/devtools/generated/spec-outline.mts` from `spec.emu`. **Run this first after any spec change.** |
| `pnpm examples:validate` | `validate-examples.mts` | Runs every example against the built engine. Reports `ok`, `FAIL` (threw when it should not, or the reverse), `STALE` (section id not in the outline), and *findings* - examples that ran but printed something other than what they claim. |
| `pnpm examples:coverage` | `check-coverage.mts` | Lists sections with no example. Exits non-zero when any are uncovered. |

`validate-examples.mts` also takes a section id to run one at a time
(`node scripts/validate-examples.mts sec-issubtype`) and a `--probe <file>` to
run a scratch program against the same engine, which is the fastest way to check
what the engine actually does before writing an example about it.

`outline-freshness.mts` is not run directly. Both tools above call it, and it
warns when the generated outline no longer matches `spec.emu` - the failure that
made a stale outline look like a broken example, and made six missing annexes
look like full coverage.

## A finding is not a failure

`validate-examples.mts` distinguishes them deliberately. A FAILURE is an example
that did not run. A FINDING is an example that ran and disagreed with its own
`expected` - which may mean the example is stale, or that the engine changed, or
that the specification did. `FINDINGS.md` says so at the top: "do not silently
edit the example to match without deciding which of the three is wrong."

## The rest

`serve.mts` (`pnpm serve`, `pnpm dev`) runs the site locally.
