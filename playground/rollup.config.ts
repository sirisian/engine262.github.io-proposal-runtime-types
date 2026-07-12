/// <reference types="node" />
import { defineConfig } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { defineRollupSwcOption, swc } from "rollup-plugin-swc3";
import { extname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, readdir, readFile, rename, writeFile, access } from "node:fs/promises";
import { LOCALES } from "./devtools/generated/locales.mts";

const libRoot = fileURLToPath(new URL(".", import.meta.resolve("chrome-devtools-frontend/package.json")));

const TOKEN_STYLESHEETS = ["application_tokens.css", "design_system_tokens.css"];
const DEVTOOLS_REVISION = "2a603a3da846fbf3977ae997477009b8d3491962";
const localeCacheRoot = fileURLToPath(new URL(`../node_modules/.cache/${DEVTOOLS_REVISION}/`, import.meta.url));
const exists = async (path: string) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

// workers to bundle:
// entrypoints/wasmparser_worker/wasmparser_worker-entrypoint.js
// entrypoints/formatter_worker/formatter_worker-entrypoint.js
// entrypoints/lighthouse_worker/lighthouse_worker.js
// entrypoints/heap_snapshot_worker/heap_snapshot_worker-entrypoint.js

export default defineConfig({
  onLog(level, log, handler) {
    if (log.code === "CIRCULAR_DEPENDENCY" || log.code === "THIS_IS_UNDEFINED") {
      return;
    }
    console.log(`[${level}] ${log.code}: ${log.message}`);
    handler(level, log);
  },
  external: ["https://cdn.jsdelivr.net/npm/marked@15.0.7/+esm"],
  input: {
    "devtools/index": "./devtools/index.mts",
    "devtools/worker": "./devtools/262_worker.mts",
    "classic/index": "./classic/index.mts",
    "classic/worker": "./classic/worker.mts",
    'devtools/formatter_worker': join(libRoot, "front_end/entrypoints/formatter_worker/formatter_worker-entrypoint.ts"),
    'devtools/heap_snapshot_worker': join(
      libRoot,
      "front_end/entrypoints/heap_snapshot_worker/heap_snapshot_worker-entrypoint.ts",
    ),
  },
  output: {
    dir: "../dist/",
    format: "esm",
    entryFileNames(chunkInfo) {
      if (chunkInfo.name === "devtools/index") return "devtools/index.js";
      if (chunkInfo.name === "devtools/worker") return "devtools/262_worker.js";
      if (chunkInfo.name === "classic/index") return "classic/index.js";
      if (chunkInfo.name === "classic/worker") return "classic/worker.js";
      if (chunkInfo.name === "devtools/formatter_worker") return "devtools/formatter_worker.js";
      if (chunkInfo.name === "devtools/heap_snapshot_worker") return "devtools/heap_snapshot_worker.js";
      throw new Error(`Unexpected chunk name ${chunkInfo.name}`);
    },
    chunkFileNames(chunkInfo) {
      if (chunkInfo.moduleIds.some((moduleId) => moduleId.startsWith(libRoot))) {
        return "devtools/[name]-[hash].js";
      }
      return "js/[name]-[hash].js";
    },
  },
  plugins: [
    {
      name: "Resolve @engine262/engine262",
      async resolveId(imported) {
        if (imported === "@engine262/engine262") return { id: "/engine262/engine262.mjs", external: true };
        if (imported === "@engine262/engine262/inspector") return { id: "/engine262/inspector.mjs", external: true };
      },
    },
    {
      name: "Copy HTML and CSS",
      async generateBundle() {
        const files = [
          ["index.html", "index.html"],
          ["devtools.html", "devtools.html"],
          ["classic/style.css", "classic/style.css"],
          ["devtools/style.css", "devtools/style.css"],
          ["github_ribbon.png", "github_ribbon.png"],
        ].concat(TOKEN_STYLESHEETS.map((css) => [join(libRoot, "front_end", css), `devtools/${css}`] as const));
        const sources = await Promise.all(files.map(([sourcePath]) => readFile(sourcePath, "utf-8")));
        for (let i = 0; i < files.length; i++) {
          const [, outName] = files[i];
          const source = sources[i];
          this.emitFile({ type: "asset", fileName: outName, source });
        }
      },
    },
    {
      name: "Prepare i18n locales",
      async buildStart() {
        await mkdir(localeCacheRoot, { recursive: true });
        for (const locale of LOCALES) {
          const localePath = join(localeCacheRoot, `${locale}.json`);
          if (await exists(localePath)) continue;

          const url = `https://chrome-devtools-frontend.appspot.com/serve_rev/@${DEVTOOLS_REVISION}/core/i18n/locales/${locale}.json`;
          console.log(`Fetching locale data for ${locale} from ${url}`);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch locale data for ${locale}: ${response.status} ${response.statusText}`);
          }
          const source = await response.text();
          if (source.length < 100) {
            throw new Error(`Locale data for ${locale} is not valid`);
          }

          const temporaryPath = `${localePath}.tmp`;
          await writeFile(temporaryPath, source);
          await rename(temporaryPath, localePath);
        }
      },
    },
    {
      name: "Patches for chrome-devtools-frontend",
      async load(id) {
        if (id === join(libRoot, "front_end/core/platform/node/node.ts")) {
          return 'throw new Error("Unsupported platform")';
        }
        if (id === join(libRoot, "front_end/models/ai_assistance/skills/SkillRegistry.ts")) {
          return "export const SKILLS = {};";
        }
        if (id === "\0virtual:front_end/panels/timeline/EasterEgg.js") {
          return "export const SHOULD_SHOW_EASTER_EGG = true;";
        }
        if (id === `\0virtual:front_end/Images/Images.js`) {
          const promises = [];
          const text: string[] = [];
          for (const image of await readdir(join(libRoot, "front_end/Images/src"))) {
            const imagePath = join(libRoot, `front_end/Images/src/${image}`);
            promises.push(
              readFile(imagePath).then((data) => {
                const base64 = `data:image/svg+xml;base64,${data.toString("base64")}`;
                const styleName = image.replace("src/", "").replace(extname(image), "");
                text.push(`  --image-file-${styleName}: url(${JSON.stringify(base64)});`);
              }),
            );
          }
          await Promise.all(promises);
          return [
            "const style = new CSSStyleSheet();",
            `style.replaceSync(\`:root {\n${text.sort().join("\n")}\n}\`);`,
            "document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];",
          ].join(`\n`);
        }
        if (id.endsWith(".css")) {
          let file = `/** ${relative(libRoot, id)} */\n` + (await readFile(id, "utf-8"));
          if (id.endsWith("dataGrid.css")) {
            // fix a CSS bug in protocol monitor on Firefox
            file += `tbody > tr[style="height: 0px;"] { display: none !important; }`;
          }
          return [`export default ${JSON.stringify(file)}`].join("\n");
        }
      },
      async resolveId(imported, importer) {
        if (imported.startsWith(".") && importer && importer.startsWith(libRoot)) {
          let resolved = fileURLToPath(new URL(imported, pathToFileURL(importer)));
          const relativePath = relative(libRoot, resolved);

          if (relativePath === "front_end/core/i18n/locales.js") {
            return fileURLToPath(new URL("./devtools/generated/locales.mts", import.meta.url));
          }

          if (
            relativePath === "front_end/Images/Images.js" ||
            relativePath === "front_end/panels/timeline/EasterEgg.js"
          ) {
            return `\0virtual:${relativePath}`;
          }

          if (await exists(resolved)) return resolved;

          if (resolved.endsWith(".css.js")) {
            resolved = resolved.replace(/\.css\.js$/, ".css");
            if (await exists(resolved)) return resolved;
          }

          if (resolved.endsWith(".js")) {
            resolved = resolved.slice(0, -3) + ".ts";
            if (await exists(resolved)) return resolved;
          }

          console.warn(`Cannot resolve ${relativePath}`);
        }
      },
    },
    nodeResolve(),
    commonjs(),
    swc(
      defineRollupSwcOption({
        extensions: [".mts", ".ts"],
        include: ["devtools/**/*.mts", "classic/**/*.mts", "**/chrome-devtools-frontend/**/*.ts"],
        exclude: [],
        tsconfig: false,
        jsc: { parser: { syntax: "typescript" }, target: "esnext" },
        minify: true,
      }),
    ),
    {
      name: "Copy locale assets",
      async generateBundle() {
        await Promise.all(
          LOCALES.map(async (locale) => {
            const source = await readFile(join(localeCacheRoot, `${locale}.json`));
            this.emitFile({
              type: "asset",
              fileName: `devtools/locales/${locale}.json`,
              name: `devtools/locales/${locale}.json`,
              source,
            });
          }),
        );
      },
    },
  ],
});
