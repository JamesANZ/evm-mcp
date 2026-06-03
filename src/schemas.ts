import { z } from "zod";

export const networkSchema = {
  network: z
    .union([z.string(), z.number()])
    .optional()
    .describe("Chain slug, name, or chain ID. Defaults to DEFAULT_NETWORK."),
};

export type NetworkArg = { network?: string | number };
