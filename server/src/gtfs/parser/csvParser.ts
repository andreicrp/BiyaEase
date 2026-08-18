import fs from 'fs';
import readline from 'readline';

/**
 * Robust CSV line tokenizer supporting standard RFC 4180 CSV quoting,
 * embedded commas, and escaped quotes ("").
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  fields.push(currentField.trim());
  return fields;
}

/**
 * Streaming CSV File Parser
 * Reads CSV files line-by-line to efficiently process large GTFS files without memory exhaustion.
 */
export async function parseCsvFile<T>(
  filePath: string,
  onRow?: (row: T, lineNumber: number) => void
): Promise<T[]> {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;
  let lineNumber = 0;
  const rows: T[] = [];

  for await (let line of rl) {
    lineNumber++;

    // Remove UTF-8 Byte Order Mark (BOM) if present on line 1
    if (lineNumber === 1 && line.charCodeAt(0) === 0xfeff) {
      line = line.slice(1);
    }

    // Skip empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue;
    }

    const fields = parseCsvLine(line);

    if (!headers) {
      // First non-empty line is header
      headers = fields.map((h) => h.replace(/^["']|["']$/g, '').trim());
      continue;
    }

    const rowObj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const headerKey = headers[i];
      if (headerKey) {
        rowObj[headerKey] = fields[i] !== undefined ? fields[i] : '';
      }
    }

    const typedRow = rowObj as unknown as T;
    if (onRow) {
      onRow(typedRow, lineNumber);
    }
    rows.push(typedRow);
  }

  return rows;
}

/**
 * In-memory CSV string parser
 */
export function parseCsvString<T>(csvContent: string): T[] {
  let content = csvContent;
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const lines = content.split(/\r?\n/);
  let headers: string[] | null = null;
  const rows: T[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const fields = parseCsvLine(rawLine);
    if (!headers) {
      headers = fields.map((h) => h.replace(/^["']|["']$/g, '').trim());
      continue;
    }

    const rowObj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      if (key) {
        rowObj[key] = fields[i] !== undefined ? fields[i] : '';
      }
    }
    rows.push(rowObj as unknown as T);
  }

  return rows;
}
