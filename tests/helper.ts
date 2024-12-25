import { env, runInDurableObject } from "cloudflare:test";
import { it } from "vitest";

export async function runInTestDurableObject(fn: (objectState: DurableObjectState) => void) {
    const id = env.test.idFromName("test");
    const stub = env.test.get(id);
    await runInDurableObject(stub, async (_, objectState) => {
        fn(objectState);
    });
}

export function durableIt(name: string, fn: (objectState: DurableObjectState) => void) {
    it(name, async () => {
        await runInTestDurableObject(fn);
    });
}