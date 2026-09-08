/// <reference path="../node_modules/@types/node/index.d.ts" />
/**
 * Runs the MARKED examples in the design repository against the built engine262.
 *
 * The design documents hold about twelve hundred fenced `js` blocks, and most are
 * fragments: a method body without its class, a snippet naming something the
 * prose declared, a shape sketched to be read rather than run. Measured, 326 of
 * them run standalone and the rest fail for reasons that are not defects. A
 * validator that ran everything would report roughly nine hundred false
 * positives, which is a validator nobody keeps.
 *
 * So a block is run only when it OPTS IN, with an HTML comment on the line before
 * its fence:
 *
 *     <!-- run -->            the block must complete normally
 *     <!-- run: throws -->    the block must not
 *     <!-- run: setup -->     the block is PRELUDE for the marked blocks after
 *                             it in the same file, and must itself complete
 *
 * The setup form exists because a document that works an example up in stages -
 * a class, then what it buys, then what it refuses - has no self-contained
 * blocks after the first. Without it the only annotatable blocks would be the
 * ones that need no context, which is the minority and not the interesting one.
 *
 * An unmarked block is skipped and counted. That makes the tool useful from the
 * first annotated block and never noisy, and it makes coverage visible: the
 * summary prints how many blocks are marked out of how many exist, so the number
 * can be driven up deliberately rather than by a flag day.
 *
 * `throws` is a first-class outcome because a document that shows what the
 * language REFUSES is doing its job, and those blocks are exactly the ones a
 * naive runner would report as broken.
 *
 * Usage:
 *   node scripts/validate-design-examples.mts             # every document
 *   node scripts/validate-design-examples.mts fixedstring # only matching paths
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const engineRoot = pathToFileURL(resolve(import.meta.dirname, "../lib/engine262/lib/")).href;
const {
  Agent, ManagedRealm, setSurroundingAgent,
} = await import(`${engineRoot}/engine262.mjs`);

/** The design repository, beside this one, as `generate-spec-outline` finds the spec. */
const DESIGN = resolve(import.meta.dirname, "../../ecmascript-types");

interface Block {
  readonly file: string;
  readonly line: number;
  readonly source: string;
  readonly expect: "normal" | "throw" | "setup";
}

function markdownFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...markdownFiles(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out.sort();
}

/** Marked blocks, and a count of every `js` block seen, so coverage is reportable. */
function blocksOf(file: string): { marked: Block[], total: number } {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  const marked: Block[] = [];
  let total = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^\s*```js\s*$/.test(lines[i]!)) {
      continue;
    }
    total += 1;
    // The marker sits on the line before the fence. Directly before, so a comment
    // further up cannot be read as governing a block it was not written for.
    const marker = /^\s*<!--\s*run(?::\s*(throws|setup))?\s*-->\s*$/.exec(lines[i - 1] ?? "");
    const body: string[] = [];
    let j = i + 1;
    for (; j < lines.length && !/^\s*```\s*$/.test(lines[j]!); j += 1) {
      body.push(lines[j]!);
    }
    if (marker) {
      const kind = marker[1] === "throws" ? "throw" : marker[1] === "setup" ? "setup" : "normal";
      marked.push({
        file, line: i + 1, source: body.join("\n"), expect: kind,
      });
    }
    i = j;
  }
  return { marked, total };
}

function run(source: string): { type: string, message: string } {
  setSurroundingAgent(new Agent({ features: ["runtime-types"] }));
  const realm = new ManagedRealm();
  try {
    const completion = realm.evaluateScriptSkipDebugger(source);
    let message = "";
    const value = completion.Value;
    if (value?.properties) {
      for (const [key, descriptor] of value.properties) {
        if (key.stringValue?.() === "message") {
          message = descriptor.Value?.stringValue?.() ?? "";
        }
      }
    }
    return { type: completion.Type, message };
  } catch (error) {
    // A HOST error is never an expected outcome: it means the engine faulted
    // rather than the program, so it is reported even for a `throws` block.
    return { type: "host", message: (error as Error).message };
  }
}

const filter = process.argv[2];
let marked = 0;
let total = 0;
let failed = 0;
for (const file of markdownFiles(DESIGN)) {
  if (filter && !file.includes(filter)) {
    continue;
  }
  const { marked: blocks, total: seen } = blocksOf(file);
  total += seen;
  marked += blocks.length;
  // Setup blocks accumulate in order, so a later block sees every prelude
  // declared above it and nothing declared below.
  let preamble = "";
  for (const block of blocks) {
    const source = block.expect === "setup" ? block.source : preamble + block.source;
    const result = run(source);
    if (block.expect === "setup") {
      // A prelude that does not run is reported like any other failure, because
      // every block after it would fail for a reason that is not its own.
      preamble += `${block.source}\n`;
    }
    const ok = result.type === (block.expect === "setup" ? "normal" : block.expect);
    if (!ok) {
      failed += 1;
      const where = `${relative(DESIGN, block.file)}:${block.line}`;
      // eslint-disable-next-line no-console
      console.error(`FAIL ${where}\n  expected ${block.expect}, got ${result.type}${result.message ? `: ${result.message}` : ""}`);
    }
  }
}

// eslint-disable-next-line no-console
console.log(`\n${marked} marked of ${total} blocks; ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
