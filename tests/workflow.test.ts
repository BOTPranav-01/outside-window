import { describe, expect, it } from "vitest";
import { openDatabase } from "../src/db.js";
import { advanceUserDay, resumeUserDay } from "../src/workflow.js";

describe("durable user-day workflow", () => {
  it("resumes scheduled work after a worker restart without duplicating state", () => {
    const db = openDatabase(":memory:");
    expect(resumeUserDay(db, "2026-10-07", 18)).toBe("scheduled");
    advanceUserDay(db, "2026-10-07", "nudged", 18);
    expect(resumeUserDay(db, "2026-10-07", 18)).toBe("nudged");
    expect(resumeUserDay(db, "2026-10-07", 18)).toBe("nudged");
  });
});
