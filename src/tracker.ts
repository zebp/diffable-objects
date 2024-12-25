import {
  applyChangeset,
  unatomizeChangeset,
  type IAtomicChange,
} from "json-diff-ts";

type Snapshot = {
  type: "snapshot";
  value: unknown;
};

type Change = {
  type: "change";
  atomicChange: IAtomicChange;
};

export type TrackerActions = [Snapshot, ...Change[]] | Change[];

export function replay<T extends object>(
  actions: TrackerActions,
  initialValue: T,
): T {
  if (actions.length === 0) {
    return initialValue;
  }

  let data =
    actions[0].type === "snapshot" ? (actions[0].value as T) : initialValue;
  assertChanges(actions);

  const atomicChanges = actions.map((it) => it.atomicChange);
  const changeSet = unatomizeChangeset(atomicChanges);
  data = applyChangeset(data, changeSet);

  return data;
}

function assertChanges(actions: TrackerActions): asserts actions is Change[] {
  if (actions.length === 0) {
    throw new Error("No changes to assert");
  }

  if (actions[0].type === "snapshot") {
    actions.shift();
  }

  actions.forEach((it, i) => {
    if (it.type !== "change") {
      throw new Error(`Expected changes, but got snapshot at index ${i}`);
    }
  });
}
