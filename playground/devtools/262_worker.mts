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
  NormalCompletion,
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
    const virtualModuleSourceCache = new Map<string, string>();
    const builtinLoader = createBuiltinModuleLoader({
      loadBuiltinModule: (moduleRequest, realm, callback) => {
        // One lookup rather than `has` then `get`: the pair reads as safe and
        // leaves the value typed `string | undefined`, which is what it is - a
        // Map can be mutated between the two calls, and the callback wants a
        // source rather than possibly nothing.
        const source = virtualModuleSourceCache.get(moduleRequest.Specifier);
        if (source !== undefined) {
          callback(source);
          return;
        }
        // A real Error rather than a thrown STRING: DevTools renders an
        // exception's description, and a string primitive has none - so a miss
        // reported this way printed `Uncaught` with nothing after it. `Throw`
        // builds the error the engine would raise itself.
        callback(Throw.Error(`No virtual module found for specifier ${moduleRequest.Specifier}. Define one with defineModule(${JSON.stringify(moduleRequest.Specifier)}, source).`) as never);
      },
    });
    agent.hostDefinedOptions.hostHooks ??= {};
    // A preprocessor module needs nothing from this host beyond the loader
    // below. The engine loads it through HostLoadImportedModule like any other
    // module and reads the macro out of its exports, so the name-keyed registry
    // that used to be required here is gone with the hook that asked for it.
    // A snippet is named `jsx.js` and imported as `"./jsx.js"`, which is how
    // anyone writes a local import - a bare specifier means a package
    // elsewhere. `createBuiltinModuleLoader` declines a relative specifier by
    // contract, its own comment saying that a name starting with "." is not a
    // builtin module, so the request never reached the snippet cache and the
    // loader chain answered `Cannot load module ./jsx.js`.
    //
    // Resolved by NORMALISING and delegating rather than by loading here, so the
    // builtin loader keeps meaning what it says and there is one compilation
    // path rather than two. A specifier that is not a known snippet falls
    // through untouched.
    //
    // The two spellings behave ALIKE rather than naming one module: measured,
    // this host gives a separate module record per referrer whichever spelling
    // is used, so `"./jsx.js"` matches what `"jsx.js"` already did and nothing
    // about identity changes.
    const snippetLoader: typeof builtinLoader = (referrer, moduleRequest, hostDefined, finish, suggestError) => {
      const asked = moduleRequest.Specifier;
      const stripped = asked.replace(/^\.\//, "");
      if (stripped !== asked && virtualModuleSourceCache.has(stripped)) {
        builtinLoader(referrer, { ...moduleRequest, Specifier: stripped }, hostDefined, finish, suggestError);
        return;
      }
      finish(undefined);
    };
    agent.hostDefinedOptions.hostHooks.HostLoadImportedModule = composeModuleLoaders([snippetLoader, builtinLoader]);
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
