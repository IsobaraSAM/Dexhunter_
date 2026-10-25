import { createFileRoute } from "@tanstack/react-router";
import { discoveryEngine } from "../../../indexer/discovery-engine";
import { ensureDexHunterEngines } from "../../../indexer/engines-boot";
import { projectBrowseToken } from "../../../indexer/browse-shape";
import { DiscoveryQueryError, parseDiscoveryParams, queryIndex } from "../../../indexer/index-query";
import { repairPonsIdentity } from "../../../indexer/pons-identity";
import { ponsIndexer } from "../../../indexer/pons-engine";
import { resolveAddress } from "../../../indexer/address-lookup";
import { searchMarkets } from "../../../indexer/direct-search";
import { isAddressQuery, matchesUserQuery, parseAddressQuery, searchRank } from "../../../src/lib/addressQuery.js";

export const Route = createFileRoute("/api/discovery")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        ensureDexHunterEngines();
        repairPonsIdentity(discoveryEngine, ponsIndexer);
        discoveryEngine.repairVenueLabels();
        const url = new URL(request.url);
        const direct = (url.searchParams.get("address") || "").trim();
        const textQuery = (url.searchParams.get("q") || "").trim();
        // List pages wait on a warm snapshot. A contract or name search should
        // not sit behind that — it asks the venue APIs itself.
        if (!direct && !textQuery) {
          const snap = discoveryEngine.ensureLiveSnapshot();
          if (snap && typeof snap.catch === "function") snap.catch(() => {});
          // A warm index should answer immediately. Waiting here made every
          // feed request sit for the full freshness timeout.
          if (discoveryEngine.indexedTokens.size === 0) {
            await Promise.race([
              snap,
              new Promise((resolve) => setTimeout(resolve, 2500)),
            ]);
          }
        }
        try {
          if (textQuery) {
            const parsed = parseAddressQuery(textQuery);
            if (isAddressQuery(parsed)) {
              const chain = url.searchParams.get("chain") || "all";
              const looked = await resolveAddress(Array.from(discoveryEngine.indexedTokens.values()), textQuery, chain);
              const tokens = looked.ambiguous ? [] : looked.tokens;
              const shape = url.searchParams.get("shape");
              const rows = shape === "browse" ? tokens.map(projectBrowseToken) : tokens;
              return Response.json({
                success: true,
                lookedUp: true,
                total: rows.length,
                message: looked.message,
                ambiguous: Boolean(looked.ambiguous),
                chain: chain || "all",
                tokens: rows,
              });
            }
            const live = await searchMarkets(textQuery);
            const indexed = [];
            for (const token of discoveryEngine.indexedTokens.values()) {
              if (matchesUserQuery(token, textQuery)) indexed.push(token);
            }
            indexed.sort((a, b) => {
              const rank = searchRank(a, textQuery) - searchRank(b, textQuery);
              if (rank !== 0) return rank;
              return Number(b?.pairCreatedAt || 0) - Number(a?.pairCreatedAt || 0);
            });
            const seen = new Set();
            const tokens = [];
            for (const token of [...indexed, ...live]) {
              const addr = token?.baseToken?.address;
              if (!addr) continue;
              const id = String(addr).startsWith("0x") ? String(addr).toLowerCase() : String(addr);
              const key = `${String(token.chainId || "").toLowerCase()}:${id}`;
              if (seen.has(key)) continue;
              seen.add(key);
              tokens.push(token);
              if (tokens.length >= 40) break;
            }
            const shape = url.searchParams.get("shape");
            const rows = shape === "browse" ? tokens.map(projectBrowseToken) : tokens;
            return Response.json({
              success: true,
              total: rows.length,
              tokens: rows,
            });
          }
          if (direct) {
            const chain = url.searchParams.get("chain") || "all";
            const indexOnly = url.searchParams.get("indexOnly") === "1";
            const looked = await resolveAddress(Array.from(discoveryEngine.indexedTokens.values()), direct, chain, { indexOnly });
            if (looked.source === "chain") {
              for (const token of looked.tokens) discoveryEngine.ingestToken(token);
            }
            const shape = url.searchParams.get("shape");
            const rows = shape === "browse" ? looked.tokens.map(projectBrowseToken) : looked.tokens;
            return Response.json({
              success: true,
              lookedUp: true,
              total: rows.length,
              message: looked.message,
              ambiguous: Boolean(looked.ambiguous),
              chain: chain || "all",
              tokens: rows,
            });
          }
          const parsed = parseDiscoveryParams(url.searchParams);
          const tokens = Array.from(discoveryEngine.indexedTokens.values()) as Array<{ chainId?: string }>;
          const page = queryIndex(tokens, parsed);
          const shape = url.searchParams.get("shape");
          const rows = shape === "browse" ? page.tokens.map(projectBrowseToken) : page.tokens;
          return Response.json({
            success: true,
            total: page.total,
            nextCursor: page.nextCursor,
            limit: parsed.limit,
            age: parsed.age,
            chain: parsed.chain || "all",
            mode: parsed.mode,
            tokens: rows,
          });
        } catch (err) {
          if (err instanceof DiscoveryQueryError || (err as { name?: string })?.name === "DiscoveryQueryError") {
            return Response.json({ success: false, error: (err as Error).message }, { status: 400 });
          }
          throw err;
        }
      },
    },
  },
});
