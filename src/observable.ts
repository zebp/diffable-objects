import { atomizeChangeset, diff, type IAtomicChange } from "json-diff-ts";

type ProcessUpdateFn = (applyChanges: () => void) => void;

type RecursivelyObservableOptions<T extends object> = {
  processUpdate?: ProcessUpdateFn;
  onUpdate: (changes: IAtomicChange[], data: T) => void;
};

export function recursivelyObservable<T extends object>(
  data: T,
  opts: RecursivelyObservableOptions<T>,
): T {
  const processUpdate =
    opts.processUpdate ??
    ((applyChanges) => {
      const old = structuredClone(data);
      applyChanges();
      const diffs = diff(old, data);
      const atomicChanges = atomizeChangeset(diffs);
      if (atomicChanges.length > 0) {
        opts.onUpdate(atomicChanges, data);
      }
    });

  const proxyOpts: ProxyHandler<T> = {
    get(target, p) {
      const property = target[p as keyof T];
      if (property !== null && typeof property === "object") {
        // @ts-ignore TODO
        return recursivelyObservable(property, {
          ...opts,
          processUpdate,
        });
      }
      return target[p as keyof T];
    },
    set(target, p, newValue) {
      processUpdate(() => {
        target[p as keyof T] = newValue;
      });
      return true;
    },
  };

  return new Proxy(data, proxyOpts) as T;
}
