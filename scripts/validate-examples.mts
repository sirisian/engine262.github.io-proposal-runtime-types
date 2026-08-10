/// <reference path="node_modules/@types/node/index.d.ts" />
/**
 * Runs every specification-tree example against the built engine262 (the
 * lib/engine262 symlink, same build the playground ships) and reports:
 *
 *   - FAIL: an example completed abruptly without `throws: true`, or completed
 *     normally despite `throws: true`, or a module example failed to link.
 *     These fail the process (exit 1) - the tree must not ship broken examples.
 *   - FINDING: an example ran but its console output differed from `expected`.
 *     These do not fail the process; they are written to the findings report,
 *     because a mismatch here is exactly the engine/spec feedback loop this
 *     playground exists for. Review them; fix the example, the engine, or the
 *     spec - whichever is wrong.
 *   - STALE: an example references a section id that no longer exists in the
 *     generated outline (spec restructured). Fails the process.
 *
 * Usage:
 *   node scripts/validate-examples.mts             # run all examples
 *   node scripts/validate-examples.mts sec-foo     # only examples whose
 *                                                  # section id contains "sec-foo"
 *   node scripts/validate-examples.mts --probe file.js   # run one ad-hoc
 *                                                  # snippet and print output
 *   --report <path>   write the findings report (default
 *                     playground/devtools/spec-tree/examples/FINDINGS.md)
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const engineRoot = pathToFileURL(resolve(import.meta.dirname, "../lib/engine262/lib/")).href;
const {
  Agent, ManagedRealm, setSurroundingAgent, inspect,
  composeModuleLoaders, createBuiltinModuleLoader, CreateBuiltinFunction,
  CreateNonEnumerableDataPropertyOrThrow, JSStringValue, ThrowCompletion, Value,
} = await import(`${engineRoot}/engine262.mjs`);
const { createConsole } = await import(`${engineRoot}/inspector.mjs`);

import { SPEC_OUTLINE, type SpecSection } from "../playground/devtools/generated/spec-outline.mts";
import { ALL_EXAMPLES } from "../playground/devtools/spec-tree/examples/index.mts";
import type { SpecExample } from "../playground/devtools/spec-tree/examples/types.mts";

interface RunResult {
  completionType: string;
  errorText?: string;
  output: string;
}

async function runExample(example: Pick<SpecExample, "code" | "mode" | "features">): Promise<RunResult> {
  const features = ["runtime-types", ...(example.features ?? [])];
  const agent = new Agent({ features });
  setSurroundingAgent(agent);
  const realm = new ManagedRealm();
  if (features.includes("virtual-module-loader")) {
    // Mirrors playground/devtools/262_worker.mts so examples exercising
    // preprocessor modules validate the same way they play.
    const virtualModuleSourceCache = new Map<string, string>();
    agent.hostDefinedOptions.hostHooks ??= {};
    agent.hostDefinedOptions.hostHooks.HostLoadImportedModule = composeModuleLoaders([
      createBuiltinModuleLoader({
        loadBuiltinModule: (moduleRequest: { Specifier: string }, _realm: unknown, callback: (r: unknown) => void) => {
          if (virtualModuleSourceCache.has(moduleRequest.Specifier)) {
            callback(virtualModuleSourceCache.get(moduleRequest.Specifier));
            return;
          }
          callback(ThrowCompletion(Value(`No virtual module found for specifier ${moduleRequest.Specifier}`)));
        },
      }),
    ]);
    const pop = realm.pushTopContext();
    const defineModule = CreateBuiltinFunction(
      function* defineModule([specifier, source]: [unknown, unknown]) {
        if (!(specifier instanceof JSStringValue) || !(source instanceof JSStringValue)) {
          return ThrowCompletion(Value("defineModule expects two strings"));
        }
        virtualModuleSourceCache.set(specifier.stringValue(), source.stringValue());
        return Value.undefined;
      },
      2,
      Value("defineModule"),
      [],
    );
    CreateNonEnumerableDataPropertyOrThrow(realm.GlobalObject, Value("defineModule"), defineModule);
    pop?.();
  }
  const output: string[] = [];
  createConsole(realm, {
    default(_method: string, args: unknown[]) {
      output.push(args.map((arg) => inspect(arg)).join(" "));
    },
  });
  let completion;
  if (example.mode === "module") {
    const done = Promise.withResolvers<any>();
    realm.evaluateModule(example.code, "example.mjs", (c: any) => done.resolve(c));
    completion = await done.promise;
    if (completion.Type === "normal") {
      const promise = completion.Value;
      if (promise?.PromiseState === "rejected") {
        completion = { Type: "throw", Value: promise.PromiseResult };
      }
    }
  } else {
    completion = realm.evaluateScriptSkipDebugger(example.code);
  }
  let errorText: string | undefined;
  if (completion.Type === "throw") {
    const pop = realm.pushTopContext();
    errorText = inspect(completion.Value);
    pop?.();
  }
  return { completionType: completion.Type, errorText, output: output.join("\n") };
}

// --probe: quick ad-hoc runs while drafting examples.
const probeIndex = process.argv.indexOf("--probe");
if (probeIndex !== -1) {
  const path = process.argv[probeIndex + 1];
  if (!path) throw new Error("--probe requires a file path");
  const code = await readFile(path, "utf8");
  const asModule = process.argv.includes("--module");
  const featuresIndex = process.argv.indexOf("--features");
  const extraFeatures = featuresIndex !== -1 ? process.argv[featuresIndex + 1].split(",") : undefined;
  const result = await runExample({ code, mode: asModule ? "module" : undefined, features: extraFeatures });
  console.log(`completion: ${result.completionType}`);
  if (result.errorText) console.log(`error: ${result.errorText}`);
  if (result.output) console.log(result.output);
  process.exit(result.completionType === "normal" ? 0 : 1);
}

const sectionIds = new Set<string>();
(function collect(nodes: SpecSection[]) {
  for (const node of nodes) {
    sectionIds.add(node.id);
    if (node.children) collect(node.children);
  }
})(SPEC_OUTLINE);

const reportIndex = process.argv.indexOf("--report");
const reportPath =
  reportIndex !== -1
    ? resolve(process.argv[reportIndex + 1])
    : resolve(import.meta.dirname, "../playground/devtools/spec-tree/examples/FINDINGS.md");
const filter = process.argv.slice(2).find((arg) => !arg.startsWith("--") && arg !== process.argv[reportIndex + 1]);

let failures = 0;
let findings: string[] = [];
let ran = 0;

for (const example of ALL_EXAMPLES) {
  if (filter && !example.section.includes(filter)) continue;
  ran += 1;
  const label = `${example.section} - ${example.title}`;
  if (!sectionIds.has(example.section)) {
    console.error(`STALE  ${label}: section id not in generated outline`);
    failures += 1;
    continue;
  }
  let result: RunResult;
  try {
    result = await runExample(example);
  } catch (error) {
    console.error(`FAIL   ${label}: harness threw: ${error}`);
    failures += 1;
    continue;
  }
  const abrupt = result.completionType !== "normal";
  if (abrupt !== !!example.throws) {
    console.error(
      `FAIL   ${label}: expected ${example.throws ? "abrupt" : "normal"} completion, got ${result.completionType}` +
        (result.errorText ? `\n       ${result.errorText.split("\n")[0]}` : ""),
    );
    failures += 1;
    continue;
  }
  if (example.expected !== undefined && result.output.trim() !== example.expected.trim()) {
    findings.push(
      `## ${label}\n\nExpected console output:\n\n\`\`\`\n${example.expected}\n\`\`\`\n\nActual:\n\n\`\`\`\n${result.output}\n\`\`\`\n`,
    );
    console.warn(`FINDING ${label}: output differs from expected (see report)`);
    continue;
  }
  console.log(`ok     ${label}`);
}

if (findings.length > 0) {
  const header = `# Example validation findings\n\nGenerated by scripts/validate-examples.mts. Each entry is an example that ran\nto completion but printed something other than what its author expected. That\nis potential feedback for the engine or the specification - do not silently\nedit the example to match without deciding which of the three is wrong.\n\n`;
  await writeFile(reportPath, header + findings.join("\n"));
  console.warn(`\n${findings.length} finding(s) written to ${reportPath}`);
}
console.log(`\n${ran} example(s) checked, ${failures} failure(s), ${findings.length} finding(s)`);
process.exit(failures > 0 ? 1 : 0);
