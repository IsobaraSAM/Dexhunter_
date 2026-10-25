import { createFileRoute } from "@tanstack/react-router";
import type { TokenPair } from "@/types";
import { argusIndexer } from "../../../indexer/argus-engine";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";

export const Route = createFileRoute("/api/argus/launches")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        ensureDexHunterEngines();
        const url = new URL(request.url);
        const portalRaw = url.searchParams.get("portal");
        const portal = portalRaw ? Number(portalRaw) : undefined;
        const tier = url.searchParams.get("tier") || undefined;
        const reusedOnly = url.searchParams.get("reusedOnly") === "true";
        const q = (url.searchParams.get("q") || "").trim().toLowerCase();
        const address = (url.searchParams.get("address") || "").trim().toLowerCase();
        const limitRaw = Number(url.searchParams.get("limit") || "0");
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(2000, limitRaw) : 0;
        let tokens = argusIndexer.getArgusTokens() as TokenPair[];
        if (portal) tokens = tokens.filter((t) => t.argusPortalId === portal);
        if (tier) tokens = tokens.filter((t) => t.argusDevBuyTier === tier);
        if (reusedOnly) tokens = tokens.filter((t) => t.argusReusedSocials?.hasReusedSocials);
        if (address) {
          tokens = tokens.filter((t) => (t.baseToken?.address || "").toLowerCase() === address);
        } else if (q) {
          tokens = tokens.filter((t) => {
            const addr = t.baseToken?.address?.toLowerCase() || "";
            const sym = t.baseToken?.symbol?.toLowerCase() || "";
            const name = t.baseToken?.name?.toLowerCase() || "";
            return addr.includes(q) || sym.includes(q) || name.includes(q);
          });
        }
        const total = tokens.length;
        if (limit > 0) tokens = tokens.slice(0, limit);
        return Response.json({
          success: true,
          total,
          message: "Argus Launchpad tokens on Arc mainnet (Chain 5042)",
          portalsTracked: [1, 2, 3, 4, 5, 6, 7, 8],
          tokens,
        });
      },
    },
  },
});
