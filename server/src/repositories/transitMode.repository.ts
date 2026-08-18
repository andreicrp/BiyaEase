import { query } from '../database/index.js';

export interface TransitMode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: Date;
}

export class TransitModeRepository {
  async findAll(): Promise<TransitMode[]> {
    const result = await query<TransitMode>('SELECT * FROM transit_modes ORDER BY name ASC;');
    return result.rows;
  }

  async findByCode(code: string): Promise<TransitMode | null> {
    const result = await query<TransitMode>('SELECT * FROM transit_modes WHERE code = $1;', [code]);
    return result.rows[0] ?? null;
  }
}

export const transitModeRepository = new TransitModeRepository();
