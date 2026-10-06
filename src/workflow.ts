import { getWorkflow, saveWorkflow, type WorkflowState } from "./db.js";
import type { DatabaseSync } from "node:sqlite";

export function resumeUserDay(db: DatabaseSync, userDay: string, hour: number): WorkflowState {
  const current = getWorkflow(db, userDay);
  if (current?.state === "completed" || current?.state === "checked_in") return current.state;
  const next: WorkflowState = current?.state === "nudged" ? "nudged" : "scheduled";
  saveWorkflow(db, userDay, next, current?.windowHour ?? hour);
  return next;
}

export function advanceUserDay(db: DatabaseSync, userDay: string, state: WorkflowState, hour: number): void {
  saveWorkflow(db, userDay, state, hour);
}
