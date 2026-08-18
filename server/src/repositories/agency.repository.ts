import { query } from '../database/index.js';

export interface Agency {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  created_at: Date;
  updated_at: Date;
}

export class AgencyRepository {
  async findAll(): Promise<Agency[]> {
    const result = await query<Agency>('SELECT * FROM agencies ORDER BY name ASC;');
    return result.rows;
  }

  async findById(id: string): Promise<Agency | null> {
    const result = await query<Agency>('SELECT * FROM agencies WHERE id = $1;', [id]);
    return result.rows[0] ?? null;
  }

  async findByCode(code: string): Promise<Agency | null> {
    const result = await query<Agency>('SELECT * FROM agencies WHERE code = $1;', [code]);
    return result.rows[0] ?? null;
  }
}

export const agencyRepository = new AgencyRepository();
