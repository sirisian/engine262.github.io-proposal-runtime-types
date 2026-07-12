import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { createTwoslasher } from "twoslash";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const contentDirectory = join(root, "src", "content");
const twoslash = createTwoslasher({
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  },
});
const supportedLanguages = new Set(["ts", "tsx", "js", "jsx"]);
let checkedBlocks = 0;

async function checkDirectory(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await checkDirectory(path);
      continue;
    }
    if (![".md", ".mdx"].includes(extname(entry.name))) continue;

    const source = await readFile(path, "utf8");
    const fencePattern = /^```([^\s]+)[^\n]*\btwoslash\b[^\n]*\n([\s\S]*?)^```\s*$/gm;
    for (const match of source.matchAll(fencePattern)) {
      const language = match[1];
      if (!supportedLanguages.has(language)) {
        throw new Error(`${relative(root, path)} uses Twoslash with unsupported language ${language}`);
      }
      try {
        twoslash(match[2], language);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Twoslash validation failed in ${relative(root, path)}: ${message}`, { cause: error });
      }
      checkedBlocks += 1;
    }
  }
}

await checkDirectory(contentDirectory);
if (checkedBlocks === 0) throw new Error("No Twoslash code blocks were checked");
console.log(`Validated ${checkedBlocks} Twoslash code blocks`);
