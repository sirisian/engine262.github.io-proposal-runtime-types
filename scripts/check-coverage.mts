/// <reference path="node_modules/@types/node/index.d.ts" />
/**
 * Coverage gate for the specification tree.
 *
 * The tree's promise is that every clause of spec.emu has at least one
 * runnable example. This script checks that promise in both directions and
 * exits non-zero if either fails:
 *
 *   - UNCOVERED: a section in the generated outline with no example. Adding a
 *     clause to spec.emu and regenerating the outline surfaces it here.
 *   - STALE: an example whose section id is not in the outline. Renaming or
 *     removing a clause surfaces it here (scripts/validate-examples.mts also
 *     fails on these, from the other side).
 *
 * Run after scripts/generate-spec-outline.mts, and alongside
 * scripts/validate-examples.mts in CI: the harness proves the examples run,
 * this proves there are enough of them.
 *
 * Usage:
 *   node scripts/check-coverage.mts            # gate
 *   node scripts/check-coverage.mts --summary  # per-chapter counts, always exit 0
 */
import { SPEC_OUTLINE, type SpecSection } from "../playground/devtools/generated/spec-outline.mts";
import { warnIfOutlineIsStale } from "./outline-freshness.mts";
import { ALL_EXAMPLES, EXAMPLES_BY_SECTION } from "../playground/devtools/spec-tree/examples/index.mts";

interface Row {
  chapter: string;
  id: string;
  title: string;
  examples: number;
}

const rows: Row[] = [];
(function walk(nodes: readonly SpecSection[], chapter: string | null) {
  for (const node of nodes) {
    const own = chapter ?? node.title;
    rows.push({ chapter: own, id: node.id, title: node.title, examples: EXAMPLES_BY_SECTION.get(node.id)?.length ?? 0 });
    if (node.children) walk(node.children, own);
  }
})(SPEC_OUTLINE, null);

const sectionIds = new Set(rows.map((row) => row.id));

// ISSUES I3/I7: the coverage number means nothing if the outline is not the
// spec's shape - a section absent from the outline is a section this script
// cannot report as uncovered, which is exactly how six annexes stayed missing.
await warnIfOutlineIsStale(sectionIds);
const uncovered = rows.filter((row) => row.examples === 0);
const stale = ALL_EXAMPLES.filter((example) => !sectionIds.has(example.section));

if (process.argv.includes("--summary")) {
  const byChapter = new Map<string, { sections: number; covered: number; examples: number }>();
  for (const row of rows) {
    const entry = byChapter.get(row.chapter) ?? { sections: 0, covered: 0, examples: 0 };
    entry.sections += 1;
    if (row.examples > 0) entry.covered += 1;
    entry.examples += row.examples;
    byChapter.set(row.chapter, entry);
  }
  const width = Math.max(...[...byChapter.keys()].map((name) => name.length));
  for (const [chapter, entry] of byChapter) {
    const mark = entry.covered === entry.sections ? " " : "!";
    console.log(
      `${mark} ${chapter.padEnd(width)}  ${String(entry.covered).padStart(3)}/${String(entry.sections).padEnd(3)} sections  ${String(entry.examples).padStart(3)} examples`,
    );
  }
  console.log(
    `\n${rows.length} sections, ${rows.length - uncovered.length} covered, ${ALL_EXAMPLES.length} examples`,
  );
  process.exit(0);
}

for (const row of uncovered) {
  console.error(`UNCOVERED  ${row.id}  (${row.title})`);
}
for (const example of stale) {
  console.error(`STALE      ${example.section}  (example "${example.title}" targets a section not in the outline)`);
}

const failures = uncovered.length + stale.length;
console.log(
  `\n${rows.length} sections, ${rows.length - uncovered.length} covered by ${ALL_EXAMPLES.length} examples` +
    (failures > 0 ? `, ${uncovered.length} uncovered, ${stale.length} stale` : ""),
);
if (failures > 0) {
  console.error(
    "\nEvery section needs at least one example. Add one to the matching chapter in\n" +
      "playground/devtools/spec-tree/examples/, verify it with scripts/validate-examples.mts,\n" +
      "and if the engine cannot run it yet, record the reason in KNOWN-DIVERGENCES.md and\n" +
      "ship the example that demonstrates what it can do.",
  );
}
process.exit(failures > 0 ? 1 : 0);
