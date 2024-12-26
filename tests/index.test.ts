import { describe, expect } from "vitest";
import { durableIt } from "./helper.js";
import * as diffable from "../src/index.js";

type SnapshotRow = {
  id: number;
  state: string;
  value: string;
  changes_id: number;
  created_at?: string;
};

describe("state tracking", () => {
  durableIt("should be able to track changes in root object", (objectState) => {
    const state = diffable.state(objectState, "test", { a: 1, b: 2 });
    state.a = 3;
    expect(state).toEqual({ a: 3, b: 2 });

    const newCopyOfState = diffable.state(objectState, "test", { a: 1, b: 2 });
    expect(newCopyOfState).toEqual({ a: 3, b: 2 });
  });

  durableIt(
    "should never snapshot",
    (objectState) => {
      const state = diffable.state(
        objectState,
        "test",
        { count: 0 },
        {
          snapshotPolicy: "never",
        },
      );

      for (let i = 0; i < 500; i++) {
        state.count++;
      }

      const snapshotRows = snapshots(objectState.storage.sql);
      expect(snapshotRows).toEqual([]);
    },
  );


  durableIt(
    "should automatically snapshot after every change",
    (objectState) => {
      const state = diffable.state(
        objectState,
        "test",
        { count: 0 },
        {
          snapshotPolicy: "every-change",
        },
      );

      state.count++;
      state.count++;
      state.count++;

      const snapshotRows = snapshots(objectState.storage.sql);
      expect(snapshotRows).toMatchInlineSnapshot(`
        [
          {
            "changes_id": 1,
            "id": 1,
            "state": "test",
            "value": {
              "count": 1,
            },
          },
          {
            "changes_id": 2,
            "id": 2,
            "state": "test",
            "value": {
              "count": 2,
            },
          },
          {
            "changes_id": 3,
            "id": 3,
            "state": "test",
            "value": {
              "count": 3,
            },
          },
        ]
      `);
    },
  );

  durableIt("should automatically snapshot after 2 changes", (objectState) => {
    const state = diffable.state(
      objectState,
      "test",
      { count: 0 },
      {
        snapshotPolicy: { changes: 2 },
      },
    );

    for (let i = 0; i < 5; i++) {
      state.count++;
    }

    const snapshotRows = snapshots(objectState.storage.sql);
    expect(snapshotRows).toMatchInlineSnapshot(`
      [
        {
          "changes_id": 2,
          "id": 1,
          "state": "test",
          "value": {
            "count": 2,
          },
        },
        {
          "changes_id": 4,
          "id": 2,
          "state": "test",
          "value": {
            "count": 4,
          },
        },
      ]
    `);
  });
});

function snapshots(sql: SqlStorage) {
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
