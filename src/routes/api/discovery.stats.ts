import { createFileRoute } from "@tanstack/react-router";
import { discoveryEngine } from "../../../indexer/discovery-engine";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/discovery/stats")({
  server: {
    handlers: {
      GET: async () => {
        ensureDexHunterEngines();
        return Response.json({ success: true, stats: discoveryEngine.getStats() });
      },
    },
  },
});
