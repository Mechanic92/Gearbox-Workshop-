/**
 * Gearbox Intelligence Module
 * 
 * Anonymous industry data collection and benchmarking engine.
 * The data moat that makes the platform acquisition-worthy.
 */

export { 
  initializeIntelligence, 
  shutdownIntelligence, 
  capturePartSignal,
  anonymizeShopId,
  categorizeService,
  normalizeMake,
  bucketYear,
  getCurrentQuarter,
} from './collector.js';

export { 
  computeAllBenchmarks,
  getBenchmark,
  getBenchmarksByType,
  getIntelligenceSummary,
} from './benchmarks.js';

export { intelligenceRouter } from './router.js';
