import { recursivelyObservable } from "./observable.js";
import { SqliteState } from "./sqlite.js";
import { unreachable } from "./util.js";

export type SnapshotPolicy = "never" | "every-change" | { changes: number };

export type StateOptions = {
  snapshotPolicy: SnapshotPolicy;
};

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
      maybeSnapshot(data, state, options.snapshotPolicy);
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
