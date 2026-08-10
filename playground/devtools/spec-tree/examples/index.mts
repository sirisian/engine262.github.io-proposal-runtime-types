import type { SpecExample } from "./types.mts";
import { foundations } from "./foundations.mts";

/**
 * Every example, in tree order. Chapter modules are added here as coverage
 * phases land; scripts/validate-examples.mts runs this whole list and the
 * coverage checker (final phase) diffs it against the generated outline.
 */
export const ALL_EXAMPLES: SpecExample[] = [...foundations];

const bySection = new Map<string, SpecExample[]>();
for (const example of ALL_EXAMPLES) {
  let list = bySection.get(example.section);
  if (!list) bySection.set(example.section, (list = []));
  list.push(example);
}
export const EXAMPLES_BY_SECTION: ReadonlyMap<string, readonly SpecExample[]> = bySection;
