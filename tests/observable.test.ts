import { vitest, describe, expect, it } from "vitest";
import { recursivelyObservable } from "../src/observable.js";

describe("recursively observable", () => {
  it("should be able to observe changes in root object", () => {
    const data = { a: 1, b: 2 };
    const onUpdate = vitest.fn();
    const observable = recursivelyObservable(data, { onUpdate });
    observable.a = 3;

    expect(onUpdate).toHaveBeenCalledWith(
      [
        {
          key: "a",
          value: 3,
          oldValue: 1,
          valueType: "Number",
          type: "UPDATE",
          path: "$.a",
        },
      ],
      { a: 3, b: 2 },
    );
  });

  it("should be able to observe changes in nested object", () => {
    const data = { a: { b: 1 } };
    const onUpdate = vitest.fn();
    const observable = recursivelyObservable(data, { onUpdate });
    observable.a.b = 2;

    expect(onUpdate).toHaveBeenCalledWith(
      [
        {
          key: "b",
          path: "$.a.b",
          value: 2,
          oldValue: 1,
          valueType: "Number",
          type: "UPDATE",
        },
      ],
      { a: { b: 2 } },
    );
  });
});
