declare const LZString: typeof import("lz-string");

const query = new URLSearchParams(document.location.hash.slice(1));

const EXTENSIONS = { __proto__: null, script: "js", module: "mjs" };

const initial = {
  __proto__: null,
  code: "print('Hello, World!');",
  mode: "script" as "script" | "module",
  features: new Set<string>(),
  gist: null as string | null,
};

export type State = typeof initial;

let state: Promise<State>;

if (query.has("gist")) {
  initial.gist = query.get("gist");
  state = fetch(`https://api.github.com/gists/${query.get("gist")}`)
    .then((r) => r.json())
    .then((data) => {
      if (data.files["state.json"]) {
        const save = JSON.parse(data.files["state.json"].content) as State;
        const file = data.files[`code.${EXTENSIONS[save.mode]}`];
        initial.code = file.content;
        initial.mode = save.mode;
        initial.features = new Set(save.features);
      } else {
        const fileName = Object.keys(data.files)[0];
        const file = data.files[fileName];
        initial.code = file.content;
        if (fileName.endsWith(".mjs")) {
          initial.mode = "module";
        }
      }
      return initial;
    })
    .catch((e) => {
      console.error("Failed to load gist data", e);
      return initial;
    });
} else {
  if (query.has("code")) {
    initial.code = LZString.decompressFromBase64(query.get("code")!);
  }
  if (query.has("mode")) {
    const mode = query.get("mode");
    if (mode === "script" || mode === "module") {
      initial.mode = query.get("mode") as "script" | "module";
    }
  }
  if (query.has("features")) {
    initial.features = new Set(query.get("features")?.split(","));
  }
  state = Promise.resolve(initial);
}

export function getStates(): Promise<State> {
  return state;
}

export function getState<T extends keyof State>(name: T): Promise<State[T]> {
  return state.then((s) => s[name]);
}

export function updateState() {
  return state.then((s) => {
    const params = new URLSearchParams();
    if (s.gist) {
      params.set("gist", s.gist);
    } else {
      params.set("code", LZString.compressToBase64(s.code));
      params.set("mode", s.mode);
      params.set("features", [...s.features].join(","));
    }
    document.location.hash = params.toString();
  });
}

export function setState<T extends keyof State>(name: T, value: State[T]): Promise<void> {
  return state
    .then((s) => {
      s[name] = value;
    })
    .then(() => updateState());
}

const saveSpan = document.querySelector<HTMLSpanElement>("#save-to-gist-output")!;
document.querySelector<HTMLButtonElement>("#save-to-gist")?.addEventListener("click", () => {
  saveSpan.textContent = "Saving...";
  state
    .then((s) =>
      fetch("https://api.engine262.js.org/gist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: s.code, state: { mode: s.mode, features: [...s.features] } }),
      })
        .then((r) => r.text())
        .then((id) => {
          s.gist = id;
          saveSpan.textContent = `Saved! ${id}`;
          return updateState();
        }),
    )
    .catch((e) => {
      saveSpan.textContent = `Error saving to gist: ${e.message}`;
    });
});
