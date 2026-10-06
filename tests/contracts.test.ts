import { describe, expect, it } from "vitest";
import { parseMicroQuest } from "../src/contracts.js";

describe("micro-quest contract", () => {
  it("accepts exactly ten-minute quests", () => {
    expect(parseMicroQuest({
      title: "Mailbox loop",
      steps: ["Put on shoes", "Walk to the mailbox", "Return home"],
      minutes: 10,
      safetyNote: "Skip it if conditions feel unsafe."
    }).minutes).toBe(10);
  });

  it("rejects malformed model output", () => {
    expect(() => parseMicroQuest({ title: "Go", minutes: 20 })).toThrow();
  });
});
