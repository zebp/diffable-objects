import type { IAtomicChange, Operation } from "json-diff-ts";
import { replay, type TrackerActions } from "./tracker.js";

const INITIAL_QUERY = `
CREATE TABLE IF NOT EXISTS changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state TEXT NOT NULL,
    type TEXT NOT NULL,
    key TEXT NOT NULL,
    path TEXT NOT NULL,
    valueType TEXT,
    value TEXT,
    oldValue TEXT
);

CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state TEXT NOT NULL,
    value TEXT NOT NULL,
    changes_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

type Change = {
  type: string;
  key: string;
  path: string;
  valueType: string | null;
  value: string | null;
  oldValue: string | null;
};

export class SqliteState<T extends object> {
  #name: string;
  #storage: DurableObjectStorage;
  #db: SqlStorage;

  constructor(name: string, storage: DurableObjectStorage) {
    this.#name = name;
    this.#storage = storage;
    this.#db = storage.sql;
    this.#db.exec(INITIAL_QUERY);
  }

  resume(initialValue: T): T {
    const results = this.#db.exec<{ value: string; changes_id: number }>(
      "SELECT value, changes_id FROM snapshots WHERE state = ? ORDER BY created_at DESC LIMIT 1",
      this.#name,
    );
    const result = results.next();

    const mapChanges = (changes: Change[]) =>
      changes.map(
        (change) =>
          ({
            type: "change",
            atomicChange: {
              type: change.type as Operation,
              key: change.key,
              path: change.path,
              valueType: change.valueType,
              value: change.value ? JSON.parse(change.value) : undefined,
              oldValue: change.oldValue
                ? JSON.parse(change.oldValue)
                : undefined,
            },
          }) as const,
      );

    if (!result.done) {
      const { value, changes_id } = result.value;
      const changes = this.#db.exec<Change>(
        "SELECT * FROM changes WHERE id > ? AND state = ?",
        changes_id,
        this.#name,
      );

      const actions: TrackerActions = [
        {
          type: "snapshot",
          value: JSON.parse(value),
        },
        ...mapChanges(changes.toArray()),
      ];

      return replay(actions, initialValue);
    }

    const changes = this.#db.exec<Change>("SELECT * FROM changes");
    return replay(mapChanges(changes.toArray()), initialValue);
  }

  appendChanges(changes: IAtomicChange[]): void {
    if (changes.length === 0) {
      return;
    }

    this.#storage.transactionSync(() => {
      for (const { type, key, path, valueType, value, oldValue } of changes) {
        this.#db.exec(
          "INSERT INTO changes (state, type, key, path, valueType, value, oldValue) VALUES (?, ?, ?, ?, ?, ?, ?)",
          this.#name,
          type,
          key,
          path,
          valueType,
          value ? JSON.stringify(value) : null,
          oldValue ? JSON.stringify(oldValue) : null,
        );
      }
    });
  }

  snapshot(snapshot: T): void {
    const { id } = this.#db
      .exec<{ id: number }>(
        "SELECT id FROM changes WHERE state = ? ORDER BY id DESC LIMIT 1",
        this.#name,
      )
      .one();

    // TODO: assert there are changes in the DB before we can snapshot.

    this.#db.exec(
      "INSERT INTO snapshots (state, value, changes_id) VALUES (?, ?, ?)",
      this.#name,
      JSON.stringify(snapshot),
      id,
    );
  }
}
