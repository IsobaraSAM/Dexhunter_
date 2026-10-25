// @ts-nocheck
import { pumpIndexer } from "./pump-engine.js";
import { discoveryEngine } from "./discovery-engine.js";
import { argusIndexer } from "./argus-engine.js";
import { ponsIndexer } from "./pons-engine.js";
import { bscLaunchIndexer } from "./bsc-launch-reader.js";
let started = false;
function ensureDexHunterEngines() {
  if (started) return;
  started = true;
  pumpIndexer.start().catch((err) => {
    console.error("[Pump Indexer] Startup error:", err);
  });
  discoveryEngine.start().catch((err) => {
    console.error("[Discovery Engine] Startup error:", err);
  });
  if (!argusIndexer._wiredToDiscovery) {
    argusIndexer._wiredToDiscovery = true;
    argusIndexer.onNewLaunch((pair) => {
      discoveryEngine.ingestToken(pair);
    });
  }
  argusIndexer.start().catch((err) => {
    console.error("[Argus Indexer] Startup error:", err);
  });
  ponsIndexer.onNewLaunch((pair) => {
    discoveryEngine.ingestToken(pair);
  });
  ponsIndexer.start().catch((err) => {
    console.error("[Pons Indexer] Startup error:", err);
  });
  bscLaunchIndexer.onNewLaunch((pair) => {
    discoveryEngine.ingestToken(pair);
  });
  bscLaunchIndexer.start().catch((err) => {
    console.error("[BSC Indexer] Startup error:", err);
  });
}
export {
  ensureDexHunterEngines
};
