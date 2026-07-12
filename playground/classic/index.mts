import "./state.mts";
import "./editor.mts";

try {
  (document.querySelector("#loading") as HTMLDialogElement | undefined)?.close?.();
} catch (e) {
  // not all browsers support this
}
