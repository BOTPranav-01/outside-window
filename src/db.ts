import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Outing = {
  id?: number;
  observedAt: string;
  went: boolean;
  source: "user" | "synthetic";
  note?: string;
};

export type WorkflowState = "scheduled" | "nudged" | "checked_in" | "completed";

export function openDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS outings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      observed_at TEXT NOT NULL,
      went INTEGER NOT NULL CHECK (went IN (0, 1)),
      source TEXT NOT NULL CHECK (source IN ('user', 'synthetic')),
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS workflow_runs (
      user_day TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      window_hour INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export function saveWorkflow(db: DatabaseSync, userDay: string, state: WorkflowState, windowHour: number): void {
  db.prepare(`
    INSERT INTO workflow_runs (user_day, state, window_hour, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_day) DO UPDATE SET state = excluded.state,
      window_hour = excluded.window_hour, updated_at = excluded.updated_at
  `).run(userDay, state, windowHour, new Date().toISOString());
}

export function getWorkflow(db: DatabaseSync, userDay: string): {
  userDay: string; state: WorkflowState; windowHour: number; updatedAt: string;
} | undefined {
  const row = db.prepare(
    "SELECT user_day AS userDay, state, window_hour AS windowHour, updated_at AS updatedAt FROM workflow_runs WHERE user_day = ?"
  ).get(userDay) as { userDay: string; state: WorkflowState; windowHour: number; updatedAt: string } | undefined;
  return row;
}

export function addOuting(db: DatabaseSync, outing: Outing): number {
  const result = db.prepare(
    "INSERT INTO outings (observed_at, went, source, note) VALUES (?, ?, ?, ?)"
  ).run(outing.observedAt, outing.went ? 1 : 0, outing.source, outing.note ?? null) as { lastInsertRowid: number | bigint };
  return Number(result.lastInsertRowid);
}

export function listOutings(db: DatabaseSync): Outing[] {
  return db.prepare(
    "SELECT id, observed_at AS observedAt, went, source, note FROM outings ORDER BY observed_at"
  ).all().map((row: any) => ({
    id: row.id,
    observedAt: row.observedAt,
    went: Boolean(row.went),
    source: row.source,
    note: row.note ?? undefined
  }));
}
