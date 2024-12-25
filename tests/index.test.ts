import { describe, expect } from "vitest";
import { durableIt } from "./helper.js";
import * as diffable from "../src/index.js";

describe("state tracking", () => {
  durableIt("should be able to track changes in root object", (objectState) => {
    const state = diffable.state(objectState, "test", { a: 1, b: 2 });
    state.a = 3;
    expect(state).toEqual({ a: 3, b: 2 });

    const newCopyOfState = diffable.state(objectState, "test", { a: 0, b: 0 });
    expect(newCopyOfState).toEqual({ a: 3, b: 2 });
  });
});
