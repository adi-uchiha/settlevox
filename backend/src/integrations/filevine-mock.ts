import type { CMSAdapter } from './cms-adapter.js';
import type { IntakeData } from '../agent/schemas.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export class FilevineMock implements CMSAdapter {
  private leads: Map<string, Partial<IntakeData>> = new Map();

  async createLead(data: Partial<IntakeData>) {
    const id = `fv_${randomUUID()}`;
    this.leads.set(id, data);
    logger.info({ id, data }, 'Mock Filevine: Lead created');
    return { id, success: true };
  }

  async updateLead(id: string, data: Partial<IntakeData>) {
    if (!this.leads.has(id)) {
      logger.warn({ id }, 'Mock Filevine: Lead not found');
      return { success: false };
    }
    
    const existing = this.leads.get(id);
    this.leads.set(id, { ...existing, ...data });
    logger.info({ id, data }, 'Mock Filevine: Lead updated');
    
    return { success: true };
  }
}
