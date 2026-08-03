import type { Engine262Feature } from "@engine262/engine262";
import { getState, getStates, updateState } from "./state.mts";

const features = document.querySelector("#features");
const output = document.querySelector("#output");

let worker: Worker;
function respawn(first = false) {
  if (worker) {
    worker.terminate();
  }
  worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  worker.addEventListener("message", ({ data }) => {
    console.log("@MAIN", data);

    if (first && data.type === "initialize") {
      const { FEATURES } = data.value;
      FEATURES.forEach(({ name, flag }: Engine262Feature) => {
        // <li>
        //   <label>
        //     <input type="checkbox">
        //     {name}
        //   </label>
        // </li>

        const input = document.createElement("input");
        input.type = "checkbox";
        input.addEventListener("change", () => {
          getState("features").then((f) => {
            if (input.checked) {
              f.add(flag);
            } else {
              f.delete(flag);
            }
            updateState();
            respawn();
          });
        });
        getState("features").then((requestedFeatures) => {
          input.checked = requestedFeatures.has(flag);
        });

        const label = document.createElement("label");
        label.appendChild(input);
        label.appendChild(document.createTextNode(name));

        const li = document.createElement("li");
        li.appendChild(label);

        features?.appendChild(li);
      });
    } else if (data.type === "console") {
      if (data.value.method === "clear") {
        const range = document.createRange();
        output && range.selectNodeContents(output);
        range.deleteContents();
      } else {
        const line = document.createElement("span");
        data.value.values.forEach((v: any) => {
          line.textContent += v;
          line.textContent += " ";
        });
        const container = document.createElement("div");
        container.className = `log-${data.value.method}`;
        container.appendChild(line);
        output?.appendChild(container);
      }
    } else if (data.type === "unhandledRejection") {
      const line = document.createElement("span");
      line.textContent = `Unhandled Rejection:\n${data.value}`;
      const container = document.createElement("div");
      container.className = "log-error";
      container.appendChild(line);
      output?.appendChild(container);
    }
  });
}

export function evaluate(code: string) {
  getStates().then((state) => {
    state.code = code;
    worker.postMessage({ type: "evaluate", value: { code, state } });
    return updateState();
  });
}

respawn(true);
