import * as Snippets from "chrome-devtools-frontend/front_end/panels/snippets/snippets.ts";
import * as Workspace from "chrome-devtools-frontend/front_end/models/workspace/workspace.ts";
import { WorkerBootstrapEvent } from "./helpers.mts";
import { Engine262ConnectionTransport } from "./connection.mts";

/**
 * A devtools SNIPPET is a file in the frontend; a module is a thing the VM can
 * import. Nothing connected the two, so the documented workflow - "create a
 * snippet named jsx.js", then `import { jsx } from "jsx.js"` - reported that no
 * such module existed.
 *
 * Every snippet is sent to the worker, which registers it under its own name.
 * The name is used verbatim: a snippet called `jsx.js` is the module `jsx.js`,
 * and the worker also answers `"./jsx.js"` for it, that being how a local
 * import is spelled.
 */
async function collectSnippets(): Promise<{ name: string, content: string }[]> {
  const project = Snippets.ScriptSnippetFileSystem.findSnippetsProject();
  if (!project) {
    return [];
  }
  const collected: { name: string, content: string }[] = [];
  for (const uiSourceCode of project.uiSourceCodes()) {
    // `displayName` is what the user typed in the Sources panel; the URL is a
    // synthetic `snippet://` one and is not what an import would name.
    const name = uiSourceCode.displayName();
    const content = await uiSourceCode.requestContentData();
    const text = (content as { text?: string }).text;
    if (typeof text === "string") {
      collected.push({ name, content: text });
    }
  }
  return collected;
}

async function syncSnippetsToVM() {
  const snippets = await collectSnippets();
  Engine262ConnectionTransport.instance?.sendRawMessage?.(
    JSON.stringify({ id: "", method: "Debugger.engine262_setSnippets", params: { snippets } }),
  );
}

export function initSnippetModules() {
  return {
    async run() {
      // On bootstrap, and again whenever a snippet is added, removed or saved -
      // so editing a macro and re-running an import needs no reload.
      WorkerBootstrapEvent.addEventListener("bootstrap", () => { void syncSnippetsToVM(); });
      const workspace = Workspace.Workspace.WorkspaceImpl.instance();
      for (const event of [
        Workspace.Workspace.Events.UISourceCodeAdded,
        Workspace.Workspace.Events.UISourceCodeRemoved,
        Workspace.Workspace.Events.WorkingCopyCommitted,
      ]) {
        workspace.addEventListener(event, () => { void syncSnippetsToVM(); });
      }
      void syncSnippetsToVM();
    },
  };
}
