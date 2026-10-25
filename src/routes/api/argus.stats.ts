import { createFileRoute } from "@tanstack/react-router";
import { argusIndexer } from "../../../indexer/argus-engine";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/argus/stats")({
  server: {
    handlers: {
      GET: async () => {
        ensureDexHunterEngines();
        return Response.json({ success: true, stats: argusIndexer.getStats() });
      },
    },
  },
});
