import { describe, expect } from "vitest";
import { SqliteState } from "../src/sqlite.js";
import { type IAtomicChange, Operation } from "json-diff-ts";
import { durableIt } from "./helper.js";

const saveChange = (sql: SqlStorage, change: IAtomicChange) =>
  sql.exec(
    `INSERT INTO changes (state, key, value, oldValue, valueType, type, path) VALUES (
    ?, ?, ?, ?, ?, ?, ?)`,
    "test",
    change.key,
    change.value ? JSON.stringify(change.value) : null,
    change.oldValue ? JSON.stringify(change.oldValue) : null,
    change.valueType,
    change.type,
    change.path,
  );

describe("sqlite state", () => {
  durableIt("doesn't throw", (objectState) => {
    void new SqliteState("test", objectState.storage);
  });

  durableIt("can resume unnested objects", (objectState) => {
    const { sql } = objectState.storage;
    const state = new SqliteState<{ a: number }>("test", objectState.storage);

    saveChange(sql, {
      key: "a",
      value: 3,
      oldValue: 1,
      valueType: "Number",
      type: Operation.UPDATE,
      path: "$.a",
    });

    const data = state.resume({ a: 1 });
    expect(data).toEqual({ a: 3 });
  });

  durableIt("can resume nested objects", (objectState) => {
    const { sql } = objectState.storage;
    const state = new SqliteState<{ a: { b: number } }>(
      "test",
      objectState.storage,
    );

    saveChange(sql, {
      key: "b",
      path: "$.a.b",
      value: 2,
      oldValue: 1,
      valueType: "Number",
      type: Operation.UPDATE,
    });

    const data = state.resume({ a: { b: 1 } });
    expect(data).toEqual({ a: { b: 2 } });
  });

  durableIt("can resume with snapshot", (objectState) => {
    const { sql } = objectState.storage;
    const state = new SqliteState<{ a: number }>("test", objectState.storage);

    saveChange(sql, {
      key: "a",
      value: 3,
      oldValue: 1,
      valueType: "Number",
      type: Operation.UPDATE,
      path: "$.a",
    });

    sql.exec(
      `INSERT INTO snapshots (state, value, changes_id)
        VALUES ('test', ?, (SELECT MAX(id) FROM changes WHERE state = 'test'))`,
      JSON.stringify({ a: 3 }),
    );

    const data = state.resume({ a: 1 });
    expect(data).toEqual({ a: 3 });
  });

  durableIt("can append changes", (objectState) => {
    const { sql } = objectState.storage;
    const state = new SqliteState<{ a: number }>("test", objectState.storage);

    state.appendChanges([
      {
        key: "a",
        value: 3,
        oldValue: 1,
        valueType: "Number",
        type: Operation.UPDATE,
        path: "$.a",
      },
      {
        type: Operation.ADD,
        key: "b",
        value: 2,
        valueType: "Number",
        path: "$.b",
      },
    ]);

    const changes = sql.exec("SELECT * FROM changes").toArray();
    expect(changes).toEqual([
      {
        id: 1,
        key: "a",
        path: "$.a",
        value: "3",
        oldValue: "1",
        valueType: "Number",
        type: Operation.UPDATE,
        state: "test",
      },
      {
        id: 2,
        key: "b",
        oldValue: null,
        path: "$.b",
        type: Operation.ADD,
        value: "2",
        valueType: "Number",
        state: "test",
      },
    ]);
  });

  durableIt("can snapshot", (objectState) => {
    const { sql } = objectState.storage;
    const state = new SqliteState<{ a: number }>("test", objectState.storage);

    saveChange(sql, {
      key: "a",
      value: 3,
      oldValue: 1,
      valueType: "Number",
      type: Operation.UPDATE,
      path: "$.a",
    });

    state.snapshot({ a: 3 });

    const { value } = sql
      .exec<{ value: string }>("SELECT * FROM snapshots")
      .one();
    expect(value).toEqual('{"a":3}');
  });
});
