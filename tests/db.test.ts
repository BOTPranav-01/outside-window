import { describe, expect, it } from "vitest";
import { openDatabase, addOuting, listOutings } from "../src/db.js";

describe("outing log", () => {
  it("round-trips a user-owned observation", () => {
    const db = openDatabase(":memory:");
    addOuting(db, {
      observedAt: "2026-10-07T08:00:00+05:30",
      went: true,
      source: "user",
      note: "Morning walk"
    });
    expect(listOutings(db)).toEqual([{
      id: 1,
      observedAt: "2026-10-07T08:00:00+05:30",
      went: true,
      source: "user",
      note: "Morning walk"
    }]);
  });
});
