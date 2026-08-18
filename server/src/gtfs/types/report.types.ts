export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  file: string;
  line?: number;
  field?: string;
  message: string;
  severity: ValidationSeverity;
  entityId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

export interface FeedRecordCounts {
  agencies: number;
  routes: number;
  stops: number;
  trips: number;
  stop_times: number;
  shapes: number;
  services: number;
  fares?: number;
}

export interface ImportReport {
  sourceName: string;
  datasetVersion: string;
  fileHash: string;
  status: 'VALIDATED' | 'IMPORTED' | 'FAILED' | 'ROLLED_BACK';
  importedAt: string;
  durationMs: number;
  recordCounts: FeedRecordCounts;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}
