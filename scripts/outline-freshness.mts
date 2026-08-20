/**
 * Is the generated outline still the shape of spec.emu?
 *
 * ISSUES-found-while-writing-examples.md I3 and I7. Two tools read
 * playground/devtools/generated/spec-outline.mts - validate-examples.mts and
 * check-coverage.mts - and both were misled by it in the same cycle, in
 * opposite directions:
 *
 *   I3, staleness: the outline had 344 ids against the specification's 378 and
 *   was a day older than the spec work. An example written for a genuinely new
 *   section reported "STALE: section id not in generated outline", which reads
 *   as the example pointing at nothing when the truth is the reverse.
 *
 *   I7, scope: the generator matched only <emu-clause>, so the six annex
 *   sections were absent. check-coverage never listed them as UNCOVERED, so a
 *   gap of six sections looked like full coverage from one end and like a
 *   broken example from the other.
 *
 * Both were one comparison away from being obvious, which is what this is. It
 * reads the spec directly and compares the SET of ids, not the count: a rename
 * that keeps the total the same is exactly the case a count would miss.
 *
 * Deliberately advisory rather than fatal. A checkout with no sibling spec is
 * ordinary - the generator itself falls back to a network fetch - and a tool
 * that refuses to run because it cannot find a file it only wanted to
 * cross-check would be worse than the problem.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SIBLING = resolve(import.meta.dirname, "../../proposal-runtime-types/spec.emu");

/** Every section id spec.emu declares, clauses and annexes alike. */
function sectionIdsOf(source: string): Set<string> {
  const ids = new Set<string>();
  const tag = /<emu-(?:clause|annex)[^>]*\bid="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(source)) !== null) ids.add(match[1]);
  return ids;
}

/**
 * Warns on stderr when the outline disagrees with the spec beside it.
 * Returns true when they agree or when there is no spec to compare against.
 */
export async function warnIfOutlineIsStale(outlineIds: ReadonlySet<string>): Promise<boolean> {
  if (!existsSync(SIBLING)) return true;
  const spec = sectionIdsOf(await readFile(SIBLING, "utf8"));
  const missing = [...spec].filter((id) => !outlineIds.has(id));
  const extra = [...outlineIds].filter((id) => !spec.has(id));
  if (missing.length === 0 && extra.length === 0) return true;
  console.error(
    `WARNING  the generated outline disagrees with ${SIBLING}:`
    + `${missing.length} section(s) in the spec are absent from it`
    + `${extra.length > 0 ? `, ${extra.length} in it are absent from the spec` : ""}.`,
  );
  const show = (label: string, ids: string[]) => {
    if (ids.length === 0) return;
    console.error(`         ${label}: ${ids.slice(0, 8).join(", ")}${ids.length > 8 ? ", …" : ""}`);
  };
  show("only in spec.emu", missing);
  show("only in the outline", extra);
  console.error("         Run scripts/generate-spec-outline.mts. Results below are against the STALE outline.");
  return false;
}
