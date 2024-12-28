import { recursivelyObservable } from "./observable.js";
import { SqliteState } from "./sqlite.js";
import { unreachable } from "./util.js";

export * from "./decorator.js";

export type SnapshotPolicy = "never" | "every-change" | { changes: number };

export type StateOptions = {
  /**
   * Diffable-objects will automatically snapshot the state perodically based on this policy to minimize the
   * number of diffs that must be applied to restore the state when the Durable Object is restarted.
   */
  snapshotPolicy?: SnapshotPolicy;
};

/**
 * Dynamically create a state object that persists changes to durable storage using Proxy and SQLite.
 *
 * @example
 * ```
 * import { DurableObject } from "cloudflare:workers";
 * import { state } from "diffable-objects";
 *
 * class Counter extends DurableObject {
 *   #state = state(this, "counter", { count: 0 });
 *
 *   async fetch(request) {
 *     this.#state.count += 1;
 *     return new Response(`Count: ${this.#state.count}`);
 *   }
 * }
 * ```
 *
 * @param ctx the DurableObject state.
 * @param name the name of the state, typically the name of the field.
 * @param initialState the initial state of this object, this must be the same every time the DO is created.
 * @param options options for configuring how the state is persisted.
 * @returns a copy of state that will persist changes.
 */
export function state<T extends object>(
  ctx: DurableObjectState,
  name: string,
  initialState: T,
  options: StateOptions = {
    snapshotPolicy: { changes: 10 },
  },
): T {
  const state = new SqliteState<T>(name, ctx.storage);
  const data = state.resume(initialState);
  return recursivelyObservable(data, {
    onUpdate(changes, data) {
      state.appendChanges(changes);
      maybeSnapshot(data, state, options.snapshotPolicy ?? { changes: 10 });
    },
  });
}

function maybeSnapshot<T extends object>(
  data: T,
  state: SqliteState<T>,
  snapshotPolicy: SnapshotPolicy,
) {
  if (snapshotPolicy === "every-change") {
    state.snapshot(data);
  } else if (
    typeof snapshotPolicy === "object" &&
    "changes" in snapshotPolicy
  ) {
    const latest = state.latestChange() ?? unreachable();
    if (latest.id % snapshotPolicy.changes === 0) {
      state.snapshot(data);
    }
  }
}
