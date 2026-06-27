import type { IntakeData } from '../agent/schemas.js';

export interface CMSAdapter {
  createLead(data: Partial<IntakeData>): Promise<{ id: string; success: boolean }>;
  updateLead(id: string, data: Partial<IntakeData>): Promise<{ success: boolean }>;
}
