import { createConsole } from "@engine262/engine262/inspector";
import {
  Agent,
  Value,
  JSStringValue,
  ManagedRealm,
  CreateDataProperty,
  CreateBuiltinFunction,
  skipDebugger,
  AbruptCompletion,
  setSurroundingAgent,
  inspect,
  FEATURES,
  createTest262Intrinsics,
  importBundledTest262Harness,
  boostTest262Harness,
  ValueCompletion,
  PromiseObject,
} from "@engine262/engine262";
import type { State } from "./state.mts";

postMessage({
  type: "initialize",
  value: { FEATURES: [{ name: "Test262 harness", flag: "test262-harness", url: "#" }].concat(FEATURES) },
});

addEventListener("message", ({ data }) => {
  console.log("@WORKER", data);

  if (data.type === "evaluate") {
    const { state, code } = data.value as { state: State; code: string };

    const promises = new Set<PromiseObject>();
    const agent = new Agent({
      features: [...state.features],
      onDebugger() {
        // Note: If you're reading this, you should try our new inspector that supports real debugger
        // https://engine262.js.org/devtools.html
        debugger;
        setTimeout(() => {
          agent.resumeEvaluate({});
        }, 100);
      },
      hostHooks: {
        HostPromiseRejectionTrackers: new Set([
          (promise, operation) => {
            switch (operation) {
              case "reject":
                promises.add(promise);
                break;
              case "handle":
                promises.delete(promise);
                break;
              default:
                break;
            }
          },
        ]),
      },
    });
    setSurroundingAgent(agent);

    const realm = new ManagedRealm({});

    const pop = realm.pushTopContext();
    const print = CreateBuiltinFunction(
      (args) => {
        postMessage({ type: "console", value: { method: "log", values: args.map((a) => inspect(a)) } });
        return Value.undefined;
      },
      1,
      Value("print"),
      [],
    );
    skipDebugger(CreateDataProperty(realm.GlobalObject, Value("print"), print));

    createConsole(realm, {
      *default(method, args) {
        postMessage({
          type: "console",
          value: {
            method,
            values: args.map((a, i) => {
              if (i === 0 && a instanceof JSStringValue) {
                return a.stringValue();
              }
              return inspect(a);
            }),
          },
        });
      },
    });
    pop?.();

    postMessage({ type: "console", value: { method: "clear", values: [] } });

    if (state.features.has("test262-harness")) {
      createTest262Intrinsics(realm, false, console.log);
      importBundledTest262Harness(realm);
      boostTest262Harness(realm);
    }

    let result;
    function handleResult(completion: ValueCompletion) {
      result = completion;
      if (result instanceof AbruptCompletion) {
        postMessage({ type: "console", value: { method: "error", values: [inspect(result.Value)] } });
      }

      for (const promise of promises) {
        postMessage({
          type: "unhandledRejection",
          value: inspect(promise.PromiseResult!),
        });
      }
    }
    if (state.mode === "script") {
      realm.evaluateScript(code, { specifier: "code.js" }, handleResult);
    } else {
      realm.evaluateModule(code, "code.mjs", handleResult);
    }
  }
});
