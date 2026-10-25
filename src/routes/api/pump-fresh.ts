import { createFileRoute } from "@tanstack/react-router";
import handler from "../../../indexer/pump-fresh";
import { runApiHandler } from "../../lib/server/http";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/pump-fresh")({
  server: {
    handlers: {
      GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler, request, { maxPerMinute: 120 })),
    },
  },
});
