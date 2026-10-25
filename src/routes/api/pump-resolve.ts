import { createFileRoute } from "@tanstack/react-router";
import handler from "../../../indexer/pump-resolve";
import { runApiHandler } from "../../lib/server/http";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/pump-resolve")({
  server: {
    handlers: {
      GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler, request, { maxPerMinute: 120 })),
    },
  },
});
