import * as SDK from "chrome-devtools-frontend/front_end/core/sdk/sdk.ts";
import * as UI from "chrome-devtools-frontend/front_end/ui/legacy/legacy.ts";
import * as ObjectUI from "chrome-devtools-frontend/front_end/ui/legacy/components/object_ui/object_ui.ts";
import { ConsolePanel } from "chrome-devtools-frontend/front_end/panels/console/console.ts";
import { featureSettings } from "../main/features.mts";
import type { SpecExample } from "./examples/types.mts";

/**
 * Evaluating an example goes through the same path as typing it into the
 * console prompt and pressing Enter (ConsolePrompt.appendCommand): the command
 * echoes as a console message, evaluates in the current execution context, and
 * the result renders below it. Before evaluating, any engine features the
 * example needs are enabled (which restarts the realm) and the console's
 * "Evaluate as" mode is switched if the example requires one.
 */
export async function playExample(example: SpecExample): Promise<void> {
  await UI.ViewManager.ViewManager.instance().showView("console");

  const previous = UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext);
  const featuresChanged = ensureFeatures(example.features);
  if (example.mode) {
    ensureMode(example.mode);
  }
  // Enabling a feature restarts the engine262 realm: the old execution
  // context is destroyed and a fresh one is announced. Wait for it (or, when
  // nothing changed, for a context to exist at all).
  const executionContext = await waitForExecutionContext(featuresChanged ? previous : null);
  if (!executionContext) {
    return;
  }
  const consoleModel = executionContext.target().model(SDK.ConsoleModel.ConsoleModel);
  if (!consoleModel) {
    return;
  }
  const message = consoleModel.addCommandMessage(executionContext, example.code);
  const expression = ObjectUI.JavaScriptREPL.JavaScriptREPL.wrapObjectLiteral(example.code);
  await consoleModel.evaluateCommandInConsole(executionContext, message, expression, /* useCommandLineAPI */ true);
}

/** Enables any features the example needs; returns true if a setting changed. */
function ensureFeatures(features: readonly string[] | undefined): boolean {
  if (!features?.length) {
    return false;
  }
  let changed = false;
  for (const flag of features) {
    for (const [feature, setting] of featureSettings) {
      if (feature.flag === flag && !setting.get()) {
        setting.set(true);
        changed = true;
      }
    }
  }
  return changed;
}

/**
 * Switches the console toolbar's "Evaluate as" selector (created by
 * modifyConsoleView) so the UI stays truthful about the mode the example ran
 * in. Dispatching "change" is what actually informs the worker.
 */
function ensureMode(mode: "script" | "module"): void {
  const toolbar = ConsolePanel.ConsolePanel.instance().element?.querySelector("devtools-toolbar");
  const select = toolbar?.querySelector("select");
  if (select && select.value !== mode) {
    select.value = mode;
    select.dispatchEvent(new Event("change"));
  }
}

function waitForExecutionContext(
  previous: SDK.RuntimeModel.ExecutionContext | null,
  timeoutMs = 3000,
): Promise<SDK.RuntimeModel.ExecutionContext | null> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve) => {
    const poll = () => {
      const context = UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext);
      if (context && context !== previous) {
        resolve(context);
      } else if (Date.now() > deadline) {
        resolve(context);
      } else {
        setTimeout(poll, 100);
      }
    };
    poll();
  });
}

/** Copies the example source, falling back to execCommand where the clipboard API is unavailable. */
export async function copyExample(example: SpecExample): Promise<void> {
  try {
    await navigator.clipboard.writeText(example.code);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = example.code;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}
