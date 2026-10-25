import { createFileRoute } from "@tanstack/react-router";
import handler from "../../../indexer/pumpfun-debug";
import { runApiHandler } from "../../lib/server/http";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/pumpfun-debug")({
  server: {
    handlers: {
      GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler, request, { maxPerMinute: 20 })),
    },
  },
});
