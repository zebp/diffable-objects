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
  name?: string;
  snapshotPolicy?: SnapshotPolicy;
};

export function diffable(
  _: any,
  { kind, name }: { kind: string; name: string },
): FieldDecoratorReturn<any>;
export function diffable(name?: string): FieldDecoratorFactoryReturn<any>;
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
