import fs from 'fs';
import path from 'path';
import { ImportReport } from '../types/report.types.js';
import { logger } from '../../utils/logger.js';

export class ImportReporter {
  public static printConsoleSummary(report: ImportReport): void {
    logger.info('\n' + '='.repeat(60));
    logger.info(`📋 BIYAEASE GTFS INGESTION REPORT`);
    logger.info('='.repeat(60));
    logger.info(`Feed Source:     ${report.sourceName}`);
    logger.info(`Dataset Version: ${report.datasetVersion}`);
    logger.info(`SHA-256 Hash:    ${report.fileHash.substring(0, 16)}...`);
    logger.info(`Status:          ${report.status}`);
    logger.info(`Duration:        ${report.durationMs}ms`);
    logger.info(`Imported At:     ${report.importedAt}`);
    logger.info('-'.repeat(60));
    logger.info(`📊 RECORD COUNTS:`);
    logger.info(`  • Agencies:    ${report.recordCounts.agencies}`);
    logger.info(`  • Routes:      ${report.recordCounts.routes}`);
    logger.info(`  • Stops:       ${report.recordCounts.stops}`);
    logger.info(`  • Trips:       ${report.recordCounts.trips}`);
    logger.info(`  • Stop Times:  ${report.recordCounts.stop_times}`);
    logger.info(`  • Shapes:      ${report.recordCounts.shapes}`);
    logger.info(`  • Services:    ${report.recordCounts.services}`);
    logger.info('-'.repeat(60));
    logger.info(`Diagnostics:     ${report.errorCount} Errors, ${report.warningCount} Warnings`);

    if (report.issues.length > 0) {
      logger.info('\n⚠️  ISSUES FOUND:');
      report.issues.slice(0, 10).forEach((issue) => {
        const icon = issue.severity === 'ERROR' ? '❌' : '⚠️';
        logger.info(
          `  ${icon} [${issue.file}${issue.line ? `:${issue.line}` : ''}] ${issue.message}`
        );
      });
      if (report.issues.length > 10) {
        logger.info(`  ... and ${report.issues.length - 10} more issues.`);
      }
    }
    logger.info('='.repeat(60) + '\n');
  }

  public static saveReportFiles(
    report: ImportReport,
    reportsDir: string
  ): { mdPath: string; jsonPath: string } {
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeVersion = report.datasetVersion.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filenameBase = `report-${safeVersion}-${timestamp}`;

    // 1. JSON Report
    const jsonPath = path.join(reportsDir, `${filenameBase}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

    // 2. Markdown Report
    const mdPath = path.join(reportsDir, `${filenameBase}.md`);
    const mdContent = `
# BiyaEase GTFS Ingestion Report

**Source**: ${report.sourceName}  
**Version**: ${report.datasetVersion}  
**Status**: ${report.status}  
**SHA-256**: \`${report.fileHash}\`  
**Imported At**: ${report.importedAt}  
**Duration**: ${report.durationMs} ms  

---

## Record Summary

| Entity | Record Count |
|---|---|
| **Agencies** | ${report.recordCounts.agencies} |
| **Routes** | ${report.recordCounts.routes} |
| **Stops** | ${report.recordCounts.stops} |
| **Trips** | ${report.recordCounts.trips} |
| **Stop Times** | ${report.recordCounts.stop_times} |
| **Shapes** | ${report.recordCounts.shapes} |
| **Services** | ${report.recordCounts.services} |

---

## Validation Diagnostics

- **Errors**: ${report.errorCount}
- **Warnings**: ${report.warningCount}

${
  report.issues.length === 0
    ? '✅ *No validation issues encountered.*'
    : `### Issues List (${report.issues.length} total)

| Severity | File | Line | Field | Message |
|---|---|---|---|---|
${report.issues.map((i) => `| ${i.severity} | \`${i.file}\` | ${i.line ?? '-'} | ${i.field ?? '-'} | ${i.message} |`).join('\n')}
`
}
`;

    fs.writeFileSync(mdPath, mdContent.trim(), 'utf8');
    return { mdPath, jsonPath };
  }
}
