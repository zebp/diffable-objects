import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";

export class TestDurableObject extends DurableObject {}

export default class Main extends WorkerEntrypoint {}
