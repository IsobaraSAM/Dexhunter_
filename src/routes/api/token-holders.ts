import { createFileRoute } from "@tanstack/react-router";
import handler from "../../../indexer/token-holders";
import { runApiHandler } from "../../lib/server/http";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/token-holders")({
  server: {
    handlers: {
      GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler, request, { maxPerMinute: 80 })),
    },
  },
});
