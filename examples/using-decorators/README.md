# using-decorators

This sample updates the [Hello World Durable Object](https://github.com/cloudflare/workers-sdk/tree/main/packages/create-cloudflare/templates/hello-world-durable-object/ts) template from Cloudflare to use `diffable-objects` using decorators.

## Note

Because `wrangler`, Cloudflare's Workers CLI, uses an older version of `esbuild` you must use `wrangler@next` in your Worker until the next major release.

## Try it out

```
pnpm dev
```