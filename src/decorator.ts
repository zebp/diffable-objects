import type { DurableObject } from "cloudflare:workers";
import { type SnapshotPolicy, state } from "./index.js";
import { unreachable } from "./util.js";

type FieldDecoratorFactoryReturn<T> = (
  value: T,
  metadata: { kind: string; name: string },
) => FieldDecoratorReturn<T>;

type FieldDecoratorReturn<T> = (this: DurableObject, initialValue: T) => T;

type DiffableArgs =
  | []
  | [DiffableOpts]
  | [name?: string]
  | [_: any, { kind: string; name: string }];

type DiffableOpts = {
  /**
   * The name of the state, typically the name of the field.
   */
  name?: string;
  /**
   * Diffable-objects will automatically snapshot the state perodically based on this policy to minimize
   * the number of diffs that must be applied to restore the state when the Durable Object is restarted.
   */
  snapshotPolicy?: SnapshotPolicy;
};

/**
 * Dynamically create a state object that persists changes to durable storage using Proxy and SQLite.
 *
 * ```
 * import { DurableObject } from "cloudflare:workers";
 * import { diffable } from "diffable-objects";
 *
 * class Counter extends DurableObject {
 *   @diffable
 *   #state = { count: 0 };
 *
 *   async fetch(request) {
 *     this.#state.count += 1;
 *     return new Response(`Count: ${this.#state.count}`);
 *   }
 * }
 * ```
 */
export function diffable(
  _: any,
  { kind, name }: { kind: string; name: string },
): FieldDecoratorReturn<any>;
/**
 * Dynamically create a state object that persists changes to durable storage using Proxy and SQLite.
 *
 * ```
 * import { DurableObject } from "cloudflare:workers";
 * import { diffable } from "diffable-objects";
 *
 * class Counter extends DurableObject {
 *   @diffable("counter")
 *   #state = { count: 0 };
 *
 *   async fetch(request) {
 *     this.#state.count += 1;
 *     return new Response(`Count: ${this.#state.count}`);
 *   }
 * }
 * ```
 */
export function diffable(name?: string): FieldDecoratorFactoryReturn<any>;
/**
 * Dynamically create a state object that persists changes to durable storage using Proxy and SQLite.
 *
 * ```
 * import { DurableObject } from "cloudflare:workers";
 * import { diffable } from "diffable-objects";
 *
 * class Counter extends DurableObject {
 *   @diffable({ name: "counter", snapshotPolicy: "never" })
 *   #state = { count: 0 };
 *
 *   async fetch(request) {
 *     this.#state.count += 1;
 *     return new Response(`Count: ${this.#state.count}`);
 *   }
 * }
 * ```
 */
export function diffable(
  options: DiffableOpts,
): FieldDecoratorFactoryReturn<any>;
export function diffable():
  | FieldDecoratorReturn<any>
  | FieldDecoratorFactoryReturn<any> {
  // biome-ignore lint/style/noArguments: <explanation>
  const args = arguments as unknown as DiffableArgs;
  const fn =
    (opts: DiffableOpts = {}) =>
    (_: any, { kind, name: fieldName }: { kind: string; name: string }) => {
      if (kind === "field") {
        return function (this: DurableObject, initialValue: any) {
          const fieldNameNonPrivate = fieldName.replace(/^#/, "");
          return state(
            this.ctx,
            opts.name ?? fieldNameNonPrivate,
            initialValue,
            {
              snapshotPolicy: opts.snapshotPolicy ?? { changes: 10 },
            },
          );
        };
      }

      throw new Error("Only fields can be persistable");
    };

  if (args.length === 0) {
    return fn();
  }

  if (args.length === 1) {
    const [optsOrName] = args;

    if (typeof optsOrName === "object") {
      return fn(optsOrName);
    }

    return fn(optsOrName ? { name: optsOrName } : {});
  }

  const [value, metadata] = args;
  return fn()(value, metadata ?? unreachable());
}
