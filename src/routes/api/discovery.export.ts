import { createFileRoute } from "@tanstack/react-router";
import { discoveryEngine } from "../../../indexer/discovery-engine";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/discovery/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        ensureDexHunterEngines();
        const url = new URL(request.url);
        const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
        const chain = url.searchParams.get("chain") || undefined;
        const modeParam = url.searchParams.get("mode") || undefined;
        const mode =
          modeParam === "latest" || modeParam === "fresh_mints" || modeParam === "trending"
            ? modeParam
            : undefined;
        const result = discoveryEngine.exportData(format, chain, mode);
        return new Response(result.data, {
          headers: {
            "Content-Type": result.contentType,
            "Content-Disposition": `attachment; filename="${result.filename}"`,
          },
        });
      },
    },
  },
});
