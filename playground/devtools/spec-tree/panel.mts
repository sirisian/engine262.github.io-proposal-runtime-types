/// <reference path="../types.d.ts" />
import * as UI from "chrome-devtools-frontend/front_end/ui/legacy/legacy.ts";
import * as Main from "chrome-devtools-frontend/front_end/entrypoints/main/main.ts";
import { Variant } from "chrome-devtools-frontend/front_end/ui/components/buttons/Button.ts";
import { SPEC_BASE_URL, SPEC_OUTLINE, type SpecSection } from "../generated/spec-outline.mts";
import { EXAMPLES_BY_SECTION } from "./examples/index.mts";
import type { SpecExample } from "./examples/types.mts";
import { copyExample, playExample } from "./run.mts";
import { L, S } from "../main/i18n.mts";
import specTreeStyles from "./specTree.css";

function el<K extends keyof HTMLElementTagNameMap>(parent: Node, tag: K, className?: string): HTMLElementTagNameMap[K];
function el(parent: Node, tag: string, className?: string): HTMLElement;
function el(parent: Node, tag: string, className?: string): HTMLElement {
  const child = document.createElement(tag);
  if (className) child.classList.add(className);
  parent.appendChild(child);
  return child;
}

const EXPANDED_KEY = "engine262-spec-tree-expanded";
const COLLAPSED_PREVIEW_LINES = 3;

type CSSInJS = string & { _tag: "CSS-in-JS" };

/**
 * The specification tree: every emu-clause of the proposal spec, in document
 * order, with runnable examples attached to their sections. Docked to the
 * right of the whole devtools UI by installSpecTreeDock below.
 */
export class SpecTreePanel extends UI.Widget.VBox {
  static #instance: SpecTreePanel | undefined;

  static instance(): SpecTreePanel {
    if (!SpecTreePanel.#instance) {
      SpecTreePanel.#instance = new SpecTreePanel();
    }
    return SpecTreePanel.#instance;
  }

  readonly #tree = new UI.TreeOutline.TreeOutlineInShadow();
  readonly #sectionElements: SectionTreeElement[] = [];
  readonly #expanded = loadExpanded();

  private constructor() {
    super();
    this.setMinimumSize(240, 0);
    this.element.classList.add("spec-tree-panel");
    this.element.setAttribute("aria-label", S.engine262(L.engine262.specTitle));
    UI.DOMUtilities.appendStyle(this.element, specTreeStyles as CSSInJS);

    const toolbar = el(this.element, "div", "spec-tree-toolbar");
    const title = el(toolbar, "span", "spec-tree-title");
    title.textContent = S.engine262(L.engine262.specTitle);
    const filter = el(toolbar, "input", "spec-tree-filter");
    filter.type = "search";
    filter.placeholder = S.engine262(L.engine262.specFilter);
    filter.setAttribute("aria-label", S.engine262(L.engine262.specFilter));
    filter.addEventListener("input", () => this.#applyFilter(filter.value));

    const container = el(this.element, "div", "spec-tree-outline-container");
    this.#tree.registerRequiredCSS(specTreeStyles as CSSInJS);
    this.#tree.setShowSelectionOnKeyboardFocus(true);
    container.appendChild(this.#tree.element);

    for (const section of SPEC_OUTLINE) {
      this.#tree.appendChild(this.#buildSection(section, 0));
    }
  }

  #buildSection(section: SpecSection, depth: number): SectionTreeElement {
    const element = new SectionTreeElement(section, this.#expanded);
    this.#sectionElements.push(element);
    for (const example of EXAMPLES_BY_SECTION.get(section.id) ?? []) {
      element.appendChild(new ExampleTreeElement(example));
    }
    for (const child of section.children ?? []) {
      element.appendChild(this.#buildSection(child, depth + 1));
    }
    if (this.#expanded.has(section.id) || (depth === 0 && this.#expanded.size === 0)) {
      element.expand();
    }
    return element;
  }

  #applyFilter(query: string): void {
    const needle = query.trim().toLowerCase();
    // Walk bottom-up so a section is visible when it or any descendant
    // matches; expand ancestors of matches while filtering.
    for (let i = this.#sectionElements.length - 1; i >= 0; i--) {
      this.#sectionElements[i].applyFilter(needle);
    }
  }
}

class SectionTreeElement extends UI.TreeOutline.TreeElement {
  readonly section: SpecSection;
  readonly #expanded: Set<string>;
  #matchesSelf = true;

  constructor(section: SpecSection, expanded: Set<string>) {
    super(undefined, undefined, `spec-${section.id}`);
    this.section = section;
    this.#expanded = expanded;
    this.setExpandable(false); // becomes expandable when children append
    const title = document.createDocumentFragment();
    const label = document.createElement("span");
    label.classList.add("spec-section-title");
    label.textContent = section.title;
    title.appendChild(label);
    const link = document.createElement("a");
    link.classList.add("spec-section-link");
    link.href = `${SPEC_BASE_URL}#${section.id}`;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "\u00A7";
    link.title = S.engine262(L.engine262.specLink);
    link.addEventListener("click", (event) => event.stopPropagation());
    title.appendChild(link);
    this.title = title;
  }

  override onexpand(): void {
    this.#expanded.add(this.section.id);
    saveExpanded(this.#expanded);
  }

  override oncollapse(): void {
    this.#expanded.delete(this.section.id);
    saveExpanded(this.#expanded);
  }

  /** Returns whether this element remained visible under the filter. */
  applyFilter(needle: string): boolean {
    this.#matchesSelf =
      needle.length === 0 ||
      this.section.title.toLowerCase().includes(needle) ||
      this.section.id.includes(needle) ||
      exampleMatches(this.section.id, needle);
    let descendantVisible = false;
    for (const child of this.children()) {
      if (child instanceof SectionTreeElement) {
        descendantVisible = child.hidden === false || descendantVisible;
      }
    }
    const visible = this.#matchesSelf || descendantVisible;
    this.hidden = !visible;
    if (needle.length > 0 && descendantVisible) {
      this.expand();
    }
    return visible;
  }
}

function exampleMatches(sectionId: string, needle: string): boolean {
  for (const example of EXAMPLES_BY_SECTION.get(sectionId) ?? []) {
    if (example.title.toLowerCase().includes(needle) || example.code.toLowerCase().includes(needle)) {
      return true;
    }
  }
  return false;
}

class ExampleTreeElement extends UI.TreeOutline.TreeElement {
  constructor(example: SpecExample) {
    super(undefined, false, "spec-example");
    this.selectable = false;
    this.setExpandable(false);
    this.title = renderExample(example);
    this.listItemElement.classList.add("spec-example-item");
  }
}

function renderExample(example: SpecExample): HTMLElement {
  const root = document.createElement("div");
  root.classList.add("spec-example");

  const head = el(root, "div", "spec-example-head");
  const title = el(head, "span", "spec-example-title");
  title.textContent = example.title;
  title.title = example.title;

  const copyButton = el(head, "devtools-button") as HTMLElement & {
    iconName: string;
    variant: Variant;
  };
  copyButton.iconName = "copy";
  copyButton.variant = Variant.ICON;
  copyButton.title = S.engine262(L.engine262.specCopy);
  copyButton.setAttribute("aria-label", S.engine262(L.engine262.specCopy));
  copyButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void copyExample(example);
  });

  const playButton = el(head, "devtools-button") as HTMLElement & {
    iconName: string;
    variant: Variant;
  };
  playButton.iconName = "play";
  playButton.variant = Variant.ICON;
  playButton.title = S.engine262(L.engine262.specPlay);
  playButton.setAttribute("aria-label", S.engine262(L.engine262.specPlay));
  playButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void playExample(example);
  });

  if (example.summary) {
    const summary = el(root, "div", "spec-example-summary");
    summary.textContent = example.summary;
  }

  const code = el(root, "pre", "spec-example-code");
  const lines = example.code.split("\n");
  if (lines.length > COLLAPSED_PREVIEW_LINES) {
    let collapsed = true;
    const expand = document.createElement("button");
    expand.classList.add("spec-example-expand");
    const render = () => {
      code.textContent = collapsed
        ? `${lines.slice(0, COLLAPSED_PREVIEW_LINES).join("\n")}\n\u2026`
        : example.code;
      expand.textContent = collapsed
        ? S.engine262(L.engine262.specShowAll, { n: lines.length })
        : S.engine262(L.engine262.specCollapse);
    };
    expand.addEventListener("click", (event) => {
      event.stopPropagation();
      collapsed = !collapsed;
      render();
    });
    render();
    root.appendChild(expand);
  } else {
    code.textContent = example.code;
  }

  return root;
}

function loadExpanded(): Set<string> {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveExpanded(expanded: Set<string>): void {
  try {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
  } catch {
    // Storage may be unavailable; expansion state is a nicety.
  }
}

/**
 * Docks the panel to the right of the entire devtools UI with a draggable
 * vertical separator, by wrapping InspectorView in a SplitWidget at the point
 * SimpleApp attaches it to the document. The sidebar width persists via the
 * split widget's setting. Call before MainImpl is constructed.
 */
export function installSpecTreeDock(): void {
  const original = Main.SimpleApp.SimpleApp.prototype.presentUI;
  Main.SimpleApp.SimpleApp.prototype.presentUI = function presentUI(document: Document): void {
    void original;
    const rootView = new UI.RootView.RootView();
    const split = new UI.SplitWidget.SplitWidget(
      /* isVertical */ true,
      /* secondIsSidebar */ true,
      "engine262-spec-tree-split-view-state",
      /* defaultSidebarWidth */ 380,
    );
    split.setMainWidget(UI.InspectorView.InspectorView.instance());
    split.setSidebarWidget(SpecTreePanel.instance());
    split.show(rootView.element);
    rootView.attachToDocument(document);
    rootView.focus();
  };
}
