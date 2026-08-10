/**
 * Example data for the specification tree. These modules are imported both by
 * the devtools bundle (to render the tree) and by scripts/validate-examples.mts
 * (to run every example against the built engine), so they must stay
 * dependency-free: plain data plus this type module only.
 */
export interface SpecExample {
  /** The emu-clause id in spec.emu this example belongs to, e.g. "sec-sametype". */
  section: string;
  /** Short label shown in the tree. */
  title: string;
  /** Optional one-line description shown above the code. */
  summary?: string;
  /** The self-contained source the play button evaluates in the console. */
  code: string;
  /**
   * Evaluate mode required by the example. Omitted means the current console
   * mode is fine (script and console both work). "module" is required for
   * examples using import/export or preprocessor blocks; the play button
   * switches the console's "Evaluate as" selector before running.
   */
  mode?: "script" | "module";
  /**
   * Engine feature flags the example needs beyond the defaults. The play
   * button enables missing ones (which restarts the realm) before evaluating.
   * "runtime-types" is on by default in the playground and need not be listed.
   */
  features?: string[];
  /**
   * When true the example is expected to complete abruptly - it demonstrates
   * an error the specification requires. The validation harness accepts a
   * throw completion for these instead of failing.
   */
  throws?: boolean;
  /**
   * Expected console output for the validation harness, compared as the
   * newline-joined sequence of console calls. Mismatches are recorded in the
   * findings report as potential engine/spec feedback rather than silently
   * rewritten. Not used by the UI.
   */
  expected?: string;
}

/** One chapter file: an ordered list of examples, possibly many per section. */
export type ExampleChapter = SpecExample[];
