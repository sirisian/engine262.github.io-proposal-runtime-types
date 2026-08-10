import type { SpecExample } from "./types.mts";
import { foundations } from "./foundations.mts";
import { conversions } from "./conversions.mts";
import { enforcement } from "./enforcement.mts";
import { declarations } from "./declarations.mts";
import { operators } from "./operators.mts";
import { functions } from "./functions.mts";
import { classes } from "./classes.mts";
import { reflection } from "./reflection.mts";
import { numericLibrary } from "./numeric-library.mts";
import { arraysAndExtensions } from "./arrays-extensions.mts";
import { grammar } from "./grammar.mts";
import { typeUniverse } from "./type-universe.mts";
import { referencesAndRegexes } from "./references-regexes.mts";
import { generics } from "./generics.mts";
import { dependentAndMetadata } from "./dependent-metadata.mts";
import { decorators } from "./decorators.mts";
import { layoutAndMisc } from "./layout-misc.mts";
import { compositesAndMatching } from "./composites-matching.mts";
import { threading } from "./threading.mts";
import { expressionsAndJson } from "./expressions-json.mts";

/**
 * Every example, in tree order. Chapter modules are added here as coverage
 * phases land; scripts/validate-examples.mts runs this whole list and the
 * coverage checker (final phase) diffs it against the generated outline.
 */
export const ALL_EXAMPLES: SpecExample[] = [...foundations, ...conversions, ...enforcement, ...declarations, ...operators, ...functions, ...classes, ...reflection, ...numericLibrary, ...arraysAndExtensions, ...grammar, ...typeUniverse, ...referencesAndRegexes, ...generics, ...dependentAndMetadata, ...decorators, ...layoutAndMisc, ...compositesAndMatching, ...threading, ...expressionsAndJson];

const bySection = new Map<string, SpecExample[]>();
for (const example of ALL_EXAMPLES) {
  let list = bySection.get(example.section);
  if (!list) bySection.set(example.section, (list = []));
  list.push(example);
}
export const EXAMPLES_BY_SECTION: ReadonlyMap<string, readonly SpecExample[]> = bySection;
