import path from 'path';
import fs from 'fs';
import { FeedValidator } from './validators/feedValidator.js';
import { GtfsImporter } from './importer/gtfsImporter.js';
import { ImportReporter } from './reporting/importReporter.js';
import { closeDatabasePool } from '../database/index.js';
import { logger } from '../utils/logger.js';

export * from './types/gtfs.types.js';
export * from './types/normalized.types.js';
export * from './types/report.types.js';
export * from './parser/csvParser.js';
export * from './validators/feedValidator.js';
export * from './normalizer/modeMapper.js';
export * from './normalizer/entityNormalizer.js';
export * from './importer/gtfsImporter.js';
export * from './reporting/importReporter.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetDir = args[1] || './data/raw/fixtures/sample-philippines';
  const force = args.includes('--force');

  if (!command || command === '--help' || command === '-h') {
    logger.info(`
BiyaEase GTFS CLI
Usage:
  tsx src/gtfs/index.ts validate [feed-directory]
  tsx src/gtfs/index.ts import   [feed-directory] [--force]
  tsx src/gtfs/index.ts report

Examples:
  npm run gtfs:validate -- ./data/raw/fixtures/sample-philippines
  npm run gtfs:import   -- ./data/raw/fixtures/sample-philippines
    `);
    process.exit(0);
  }

  const resolvedDir = path.resolve(process.cwd(), targetDir);

  if (command === 'validate') {
    logger.info(`🔍 Validating GTFS feed at: ${resolvedDir}`);
    const { feed, validation } = await FeedValidator.loadAndValidateFeed(resolvedDir);

    const report = {
      sourceName: path.basename(resolvedDir),
      datasetVersion: 'preview',
      fileHash: 'preview',
      status: validation.isValid ? ('VALIDATED' as const) : ('FAILED' as const),
      importedAt: new Date().toISOString(),
      durationMs: 0,
      recordCounts: feed?.recordCounts ?? {
        agencies: 0,
        routes: 0,
        stops: 0,
        trips: 0,
        stop_times: 0,
        shapes: 0,
        services: 0,
      },
      errorCount: validation.errorCount,
      warningCount: validation.warningCount,
      issues: validation.issues,
    };

    ImportReporter.printConsoleSummary(report);
    const reportsDir = path.resolve(process.cwd(), 'data/reports');
    ImportReporter.saveReportFiles(report, reportsDir);
    process.exit(validation.isValid ? 0 : 1);
  }

  if (command === 'import') {
    logger.info(`📦 Ingesting GTFS feed at: ${resolvedDir}`);
    try {
      const report = await GtfsImporter.importFeed({
        feedDir: resolvedDir,
        force,
      });
      await closeDatabasePool();
      process.exit(report.status === 'IMPORTED' || report.status === 'VALIDATED' ? 0 : 1);
    } catch (error) {
      logger.error('Unhandled import error:', error);
      await closeDatabasePool();
      process.exit(1);
    }
  }

  if (command === 'report') {
    const reportsDir = path.resolve(process.cwd(), 'data/reports');
    if (!fs.existsSync(reportsDir)) {
      logger.info('No reports found.');
      process.exit(0);
    }
    const files = fs
      .readdirSync(reportsDir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .reverse();
    if (files.length === 0) {
      logger.info('No report files available.');
      process.exit(0);
    }
    const latestFile = path.join(reportsDir, files[0]!);
    const content = fs.readFileSync(latestFile, 'utf8');
    logger.info(`\n📄 Latest Ingestion Report (${files[0]}):\n`);
    logger.info(content);
    process.exit(0);
  }

  logger.error(`Unknown command "${command}". Run with --help for usage instructions.`);
  process.exit(1);
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  main().catch((err) => {
    logger.error('Fatal CLI error:', err);
    process.exit(1);
  });
}
