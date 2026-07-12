import { getState, setState } from "./state.mts";
import { evaluate } from "./runner.mts";

declare const CodeMirror: typeof import("codemirror");
const autoEvaluate = document.querySelector<HTMLInputElement>("#autoevaluate");
const selectFileButton = document.querySelector("#select-file");
selectFileButton?.addEventListener("click", async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.click();
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const content = await file.text();
    editor.setValue(content);
  };
});
const runButton = document.querySelector<HTMLButtonElement>("#run");
const mode = document.querySelector<HTMLSelectElement>("#mode");

const editor = CodeMirror.fromTextArea(document.querySelector("#input")!, { lineNumbers: true, mode: "javascript" });

let onChangeTimer: ReturnType<typeof setTimeout> | null = null;
function run(timer: boolean) {
  if (timer) {
    if (onChangeTimer !== null) {
      clearTimeout(onChangeTimer);
    }
    onChangeTimer = setTimeout(() => {
      onChangeTimer = null;
      evaluate(editor.getValue());
    }, 500);
  } else {
    evaluate(editor.getValue());
  }
}

editor.on("change", () => {
  if (!autoEvaluate?.checked) {
    return;
  }
  run(true);
});

runButton?.addEventListener("click", () => {
  run(false);
});

getState("code").then((code) => {
  editor.setValue(code);
});

mode?.addEventListener("change", () => {
  const value = mode.value;
  if (value !== "module" && value !== "script") return;
  setState("mode", value);
  run(false);
});

getState("mode").then((m) => {
  if (mode) {
    mode.value = m;
  }
});
