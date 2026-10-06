import { z } from "zod";

export const outingInput = z.object({
  observedAt: z.string().datetime({ offset: true }),
  went: z.boolean(),
  source: z.enum(["user", "synthetic"]).default("user"),
  note: z.string().max(500).optional()
});

export const microQuest = z.object({
  title: z.string().min(1).max(80),
  steps: z.array(z.string().min(1).max(160)).min(1).max(3),
  minutes: z.literal(10),
  safetyNote: z.string().min(1).max(240)
});

export type MicroQuest = z.infer<typeof microQuest>;

export function parseMicroQuest(value: unknown): MicroQuest {
  return microQuest.parse(value);
}
