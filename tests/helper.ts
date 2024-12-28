import { env, runInDurableObject } from "cloudflare:test";
import { it } from "vitest";

export async function runInTestDurableObject(
  fn: (objectState: DurableObjectState) => void,
) {
  const id = env.test.idFromName("test");
  const stub = env.test.get(id);
  await runInDurableObject(stub, async (_, objectState) => {
    fn(objectState);
  });
}

export function durableIt(
  name: string,
  fn: (objectState: DurableObjectState) => void,
) {
  it(name, async () => {
    await runInTestDurableObject(fn);
  });
}

type SnapshotRow = {
  id: number;
  state: string;
  value: string;
  changes_id: number;
  created_at?: string;
};

export function snapshots(sql: SqlStorage) {
  return sql
    .exec<SnapshotRow>("SELECT * FROM snapshots")
    .toArray()
    .map((row) => {
      // biome-ignore lint/performance/noDelete: <explanation>
      delete row.created_at;
      return {
        ...row,
        value: JSON.parse(row.value),
      };
    });
}
