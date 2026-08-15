// @ts-check
import { ECMAScriptFunctionObject } from "@engine262/engine262";
import { Mutable } from "@engine262/engine262";
import { ObjectValue } from "@engine262/engine262";
import { BuiltinFunctionObject } from "@engine262/engine262";
import {
  setSurroundingAgent,
  Agent,
  ManagedRealm,
  createTest262Intrinsics,
  X,
  boostTest262Harness,
  Get,
  Set,
  Value,
  Throw,
  CreateBuiltinFunction,
  JSStringValue,
  CreateNonEnumerableDataPropertyOrThrow,
  surroundingAgent,
  importBundledTest262Harness,
  composeModuleLoaders,
  createBuiltinModuleLoader,
  ModuleCache,
  ThrowCompletion,
} from "@engine262/engine262";
import { Inspector, createConsole } from "@engine262/engine262/inspector";

let abortController = new AbortController();
class WorkerInspector extends Inspector {
  send(data: any) {
    postMessage(data);
  }
  constructor() {
    super();
    addEventListener("message", (e) => {
      const { id, method, params } = JSON.parse(e.data);
      if (method === "Debugger.engine262_setFeatures") {
        abortController.abort();
        abortController = new AbortController();
        recreateAgent(params.features, abortController.signal);
        this.send({ id, result: {} });
        return;
      }
      this.onMessage(id, method, params);
    });
  }
}

const inspector = new WorkerInspector();
console.log("engine262 worker started");
postMessage("hello");

function recreateAgent(features: string[], signal: AbortSignal) {
  const agent = new Agent({ features });
  setSurroundingAgent(agent);

  const realm = new ManagedRealm({ name: "playground repl", resolverCache: new ModuleCache() });
  createConsole(realm, {});

  inspector.attachAgent(agent, [realm]);
  signal.addEventListener("abort", () => inspector.detachAgent(agent), { once: true });

  if (features.includes("virtual-module-loader")) {
    const virtualModuleSourceCache = new Map();
    const builtinLoader = createBuiltinModuleLoader({
      loadBuiltinModule: (moduleRequest, realm, callback) => {
        if (virtualModuleSourceCache.has(moduleRequest.Specifier)) {
          const source = virtualModuleSourceCache.get(moduleRequest.Specifier);
          callback(source);
          return;
        }
        callback(ThrowCompletion(Value(`No virtual module found for specifier ${moduleRequest.Specifier}`)));
      },
    });
    agent.hostDefinedOptions.hostHooks ??= {};
    // proposal-runtime-types sec-preprocessor-modules: "A preprocessor module is
    // fetched and evaluated before the importing module is parsed", and fetching
    // is HOST business - the engine asks through this hook and reads *undefined*
    // as "this host has no preprocessor modules", leaving the decoration to
    // parse as an ordinary one.
    //
    // Defining modules without answering this is the worst of both: the
    // decoration survives expansion and applies at RUN TIME as an ordinary class
    // decorator, so a macro's return replaces the class it decorated.
    //
    // The name is keyed by what the import BINDS, so the importing module's own
    // preprocessor imports are scanned for it and the module they name is
    // evaluated; its exports are the macros.
    const preprocessorExports = new Map();
    agent.hostDefinedOptions.hostHooks.HostResolveReplacementDecorator = (name, specifier) => {
      const key = `${specifier ?? ""}\u0000${name}`;
      if (preprocessorExports.has(key)) {
        return preprocessorExports.get(key);
      }
      const importing = specifier === undefined ? undefined : virtualModuleSourceCache.get(specifier);
      if (importing === undefined) {
        return undefined;
      }
      const pattern = /import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']\s*with\s*\{([^}]*)\}/g;
      for (const match of importing.matchAll(pattern)) {
        const [, bindings, from, attributes] = match;
        if (!/preprocessor\s*:\s*["']true["']/.test(attributes)) {
          continue;
        }
        const bound = bindings.split(",").map((b) => {
          const parts = b.split(/\s+as\s+/).map((x) => x.trim());
          return { exported: parts[0], local: parts[parts.length - 1] };
        });
        const entry = bound.find((b) => b.local === name);
        if (!entry) {
          continue;
        }
        const macroSource = virtualModuleSourceCache.get(from);
        if (macroSource === undefined) {
          return undefined;
        }
        const asScript = macroSource.replace(/export\s+/g, "");
        const pop2 = realm.pushTopContext();
        const completion = realm.evaluateScriptSkipDebugger(`${asScript}\n;${entry.exported};`);
        pop2?.();
        const resolved = completion.Type === "normal" ? completion.Value : undefined;
        preprocessorExports.set(key, resolved);
        return resolved;
      }
      return undefined;
    };
    agent.hostDefinedOptions.hostHooks.HostLoadImportedModule = composeModuleLoaders([builtinLoader]);
    const pop = realm.pushTopContext();
    const defineModule = CreateBuiltinFunction(
      function* defineModule([specifier, source]) {
        if (!(specifier instanceof JSStringValue)) {
          return Throw.TypeError("specifier is not a string");
        }
        if (!(source instanceof JSStringValue)) {
          return Throw.TypeError("source is not a string");
        }
        if (surroundingAgent.debugger_cannotPreview) {
          return surroundingAgent.debugger_cannotPreview;
        }
        virtualModuleSourceCache.set(specifier.stringValue(), source.stringValue());
        return Value.undefined;
      },
      2,
      "defineModule",
      ["SourceText"],
    );
    (defineModule satisfies BuiltinFunctionObject as unknown as Mutable<ECMAScriptFunctionObject>).SourceText =
      "function defineModule(specifier, source) { [native code] }";
    CreateNonEnumerableDataPropertyOrThrow(realm.GlobalObject, Value("defineModule"), defineModule);
    pop?.();
  }

  if (features.includes("test262-harness")) {
    createTest262Intrinsics(realm, false, console.log);
    importBundledTest262Harness(realm);
    const pop = realm.pushTopContext();
    const consoleTrace = X(Get(X(Get(realm.GlobalObject, Value("console"))) as ObjectValue, Value("trace")));
    X(Set(realm.GlobalObject, Value("__consolePrintHandle__"), consoleTrace, Value.true));
    pop?.();
    boostTest262Harness(realm);
  }
}
