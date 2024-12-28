import { diffable } from "../src/index.js";
import { describe, expect } from "vitest";
import { durableIt, snapshots } from "./helper.js";
import { DurableObject } from "cloudflare:workers";
import { env } from "cloudflare:test";

describe("state tracking with decorators", () => {
  durableIt("should track with no args", (objectState) => {
    class TestObject extends DurableObject {
      @diffable
      state = { count: 0 };
    }

    const obj = new TestObject(objectState, env);
    for (let i = 0; i < 20; i++) {
      obj.state.count++;
    }

    const snapshowRows = snapshots(objectState.storage.sql);
    expect(snapshowRows).toMatchInlineSnapshot(`
      [
        {
          "changes_id": 10,
          "id": 1,
          "state": "state",
          "value": {
            "count": 10,
          },
        },
        {
          "changes_id": 20,
          "id": 2,
          "state": "state",
          "value": {
            "count": 20,
          },
        },
      ]
    `);
  });

  durableIt("should track with empty args", (objectState) => {
    class TestObject extends DurableObject {
      @diffable()
      state = { count: 0 };
    }

    const obj = new TestObject(objectState, env);
    for (let i = 0; i < 20; i++) {
      obj.state.count++;
    }

    const snapshowRows = snapshots(objectState.storage.sql);
    expect(snapshowRows).toMatchInlineSnapshot(`
      [
        {
          "changes_id": 10,
          "id": 1,
          "state": "state",
          "value": {
            "count": 10,
          },
        },
        {
          "changes_id": 20,
          "id": 2,
          "state": "state",
          "value": {
            "count": 20,
          },
        },
      ]
    `);
  });

  durableIt("should track with named args", (objectState) => {
    class TestObject extends DurableObject {
      @diffable("foo")
      state = { count: 0 };
    }

    const obj = new TestObject(objectState, env);
    for (let i = 0; i < 20; i++) {
      obj.state.count++;
    }

    const snapshowRows = snapshots(objectState.storage.sql);
    expect(snapshowRows).toMatchInlineSnapshot(`
      [
        {
          "changes_id": 10,
          "id": 1,
          "state": "foo",
          "value": {
            "count": 10,
          },
        },
        {
          "changes_id": 20,
          "id": 2,
          "state": "foo",
          "value": {
            "count": 20,
          },
        },
      ]
    `);
  });

  durableIt("should track with options", (objectState) => {
    class TestObject extends DurableObject {
      @diffable({ name: "foo", snapshotPolicy: "every-change" })
      state = { count: 0 };
    }

    const obj = new TestObject(objectState, env);
    obj.state.count++;
    obj.state.count++;

    const snapshowRows = snapshots(objectState.storage.sql);
    expect(snapshowRows).toMatchInlineSnapshot(`
      [
        {
          "changes_id": 1,
          "id": 1,
          "state": "foo",
          "value": {
            "count": 1,
          },
        },
        {
          "changes_id": 2,
          "id": 2,
          "state": "foo",
          "value": {
            "count": 2,
          },
        },
      ]
    `);
  });
});
