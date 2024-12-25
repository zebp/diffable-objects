import { recursivelyObservable } from "./observable.js";
import { SqliteState } from "./sqlite.js";

export function state<T extends object>(
  ctx: DurableObjectState,
  name: string,
  initialState: T,
): T {
  const state = new SqliteState<T>(name, ctx.storage);
  const data = state.resume(initialState);
  return recursivelyObservable(data, {
    onUpdate(changes, data) {
      state.appendChanges(changes);
      state.snapshot(data);
    },
  });
}
