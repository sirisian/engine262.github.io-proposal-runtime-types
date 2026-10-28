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
  bundledTest262HarnessEntries,
  importTest262HarnessFile,
  composeModuleLoaders,
  createBuiltinModuleLoader,
  ModuleCache,
  ThrowCompletion,
  NormalCompletion,
} from "@engine262/engine262";
import { Inspector, createConsole } from "@engine262/engine262/inspector";

let abortController = new AbortController();
/**
 * The frontend's snippets, by name. Kept at module scope rather than inside an
 * agent so they survive `recreateAgent` - a feature toggle rebuilds the VM, and
 * a snippet the user wrote is not the VM's to forget.
 */
const snippetSources = new Map<string, string>();
let installSnippets: ((sources: ReadonlyMap<string, string>) => void) | undefined;
function setSnippetModules(snippets: { name: string, content: string }[]) {
  snippetSources.clear();
  for (const { name, content } of snippets) {
    snippetSources.set(name, content);
  }
  installSnippets?.(snippetSources);
}
// Protocol methods that run or inspect user code. While the realm is still
// being prepared (the test262 harness takes tens of seconds to import), these
// are held in order and replayed once it is ready; everything else, the
// enable handshakes and the execution-context announcements among them, goes
// through at once, so the console's context selector is populated immediately
// and an entry typed early runs as soon as the realm can take it.
// A plain array: `Set` in this module is the engine's abstract operation,
// imported above, not the global constructor.
const deferredWhileRealmPrepares: readonly string[] = [
  "Runtime.evaluate",
  "Runtime.compileScript",
  "Runtime.callFunctionOn",
  "Runtime.awaitPromise",
  "Runtime.runScript",
  "Debugger.evaluateOnCallFrame",
];

class WorkerInspector extends Inspector {
  #realmPreparing = false;
  #heldMessages: { id: unknown, method: string, params: unknown }[] = [];
  send(data: any) {
    postMessage(data);
  }
  constructor() {
    super();
    addEventListener("message", (e) => {
      const { id, method, params } = JSON.parse(e.data);
      // A devtools SNIPPET is a file in the frontend, not a module in the VM -
      // nothing connected the two, so `create a snippet named jsx.js` and then
      // `import ... from "jsx.js"` reported that no such module existed. The
      // frontend sends its snippets here and they become modules, which is what
      // the documented workflow has always claimed happens.
      if (method === "Debugger.engine262_setSnippets") {
        setSnippetModules(params.snippets ?? []);
        this.send({ id, result: {} });
        return;
      }
      if (method === "Debugger.engine262_setFeatures") {
        abortController.abort();
        abortController = new AbortController();
        this.#heldMessages = [];
        recreateAgent(params.features, abortController.signal, this);
        this.send({ id, result: {} });
        return;
      }
      if (this.#realmPreparing && deferredWhileRealmPrepares.includes(method)) {
        this.#heldMessages.push({ id, method, params });
        return;
      }
      this.onMessage(id, method, params);
    });
  }
  realmPreparing(preparing: boolean) {
    this.#realmPreparing = preparing;
    if (!preparing) {
      const held = this.#heldMessages;
      this.#heldMessages = [];
      for (const { id, method, params } of held) {
        this.onMessage(id, method, params);
      }
    }
  }
}

const inspector = new WorkerInspector();
console.log("engine262 worker started");
postMessage("hello");

function recreateAgent(features: string[], signal: AbortSignal, inspector: WorkerInspector) {
  const agent = new Agent({ features });
  setSurroundingAgent(agent);

  const realm = new ManagedRealm({ name: "playground repl", resolverCache: new ModuleCache() });
  createConsole(realm, {});

  inspector.attachAgent(agent, [realm]);
  signal.addEventListener("abort", () => inspector.detachAgent(agent), { once: true });

  // ALWAYS, not behind a flag. Without a module loader every import in the
  // console fails with "Host does not set a module loader", and the console
  // accepts static imports now - a preprocessor macro cannot be imported any
  // other way, expansion running before evaluation.
  //
  // Defaulting the flag on would not have been enough: Common.Settings persists
  // it, so anyone who had already opened the devtools would keep the stored
  // *false* and keep the broken console.
  {
    const virtualModuleSourceCache = new Map<string, string>(snippetSources);
    // Later edits reach this agent's cache too, so editing a snippet and
    // re-running an import does not need a reload.
    //
    // Updating the SOURCE map is not enough on its own. The realm's
    // resolverCache holds the COMPILED module for a specifier and is consulted
    // before the loader is, so once a snippet has been imported the loader is
    // never asked again and every later import serves the first compilation -
    // for the life of the realm. Editing `jsx.js` and re-running then appears
    // to do nothing, which is indistinguishable from the edit not having been
    // saved.
    //
    // Forgetting the compiled modules is what makes the edit take. Records
    // already linked against them keep working; only the next import
    // recompiles.
    installSnippets = (sources) => {
      for (const [name, content] of sources) {
        virtualModuleSourceCache.set(name, content);
      }
      realm.HostDefined.resolverCache?.clear();
    };
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
    // One harness file per task, so the frontend's handshake and the console's
    // other traffic interleave with the import instead of waiting behind the
    // whole of it; evaluations are held until the harness is in place.
    const entries = bundledTest262HarnessEntries();
    inspector.realmPreparing(true);
    const step = () => {
      if (signal.aborted) {
        return;
      }
      const next = entries.shift();
      if (next) {
        try {
          importTest262HarnessFile(realm, next[0], next[1]);
        } catch (error) {
          console.error(`test262 harness file ${next[0]} failed to import`, error);
        }
        setTimeout(step, 0);
        return;
      }
      const pop = realm.pushTopContext();
      const consoleTrace = X(Get(X(Get(realm.GlobalObject, Value("console"))) as ObjectValue, Value("trace")));
      X(Set(realm.GlobalObject, Value("__consolePrintHandle__"), consoleTrace, Value.true));
      pop?.();
      boostTest262Harness(realm);
      inspector.realmPreparing(false);
    };
    signal.addEventListener("abort", () => inspector.realmPreparing(false), { once: true });
    setTimeout(step, 0);
  }
}
