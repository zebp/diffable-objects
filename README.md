<h1 align="center">diffable-objects</h1>

<p align="center">
  A package for dynamic state tracking for Cloudflare's <a href="https://developers.cloudflare.com/durable-objects/">Durable Objects</a> using SQLite.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/diffable-objects">
    <img src="https://img.shields.io/npm/v/diffable-objects?style=for-the-badge" alt="downloads" height="24">
  </a>
  <a href="https://github.com/zebp/diffable-objects/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/zebp/diffable-objects/ci.yaml?branch=main&style=for-the-badge" alt="npm version" height="24">
  </a>
  <a href="https://github.com/zebp/diffable-objects">
    <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT license" height="24">
  </a>
</p>

## Installation

```
# NPM
$ npm install --save diffable-objects
# Yarn
$ yarn add diffable-objects
# PNPM
$ pnpm add diffable-objects
# Bun
$ bun add diffable-objects
```

## Example 

> For complete examples see the [examples](./examples/) directory.

Basic example of `diffable-objects`.

```typescript
import { DurableObject } from "cloudflare:workers";
export { diffable, state } from "diffable-objects";

export class SampleObject extends DurableObject {
  // Within a durale object we can register a property to
  // have its values automatically tracked and persisted.
  #state = state(this.ctx, "state", { count: 0 });

  increment() {
    this.#state.count++;
  }
}

// Currently requires wrangler@next
export class DecoratorObject extends DurableObject {
  // You can also use decorators if you'd prefer a simpler
  // (but more magic) syntax.
  @diffable
  #state = { count: 0 };

  // Snapshot policies are configrable via an options object.
  @diffable({ snapshotPolicy: "every-change" })
  #stateWithOptions = { count: 0 };

  increment() {
    this.#state.count++;
    this.#stateWithOptions.count++;
  }
}
```

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
