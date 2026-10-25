import { createFileRoute } from "@tanstack/react-router";
import handler from "../../../indexer/pumpfun-diagnostic";
import { runApiHandler } from "../../lib/server/http";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/pumpfun-audit")({
  server: {
    handlers: {
      GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler, request, { maxPerMinute: 15 })),
    },
  },
});
