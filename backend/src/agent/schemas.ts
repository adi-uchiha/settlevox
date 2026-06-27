import { z } from 'zod';

export const IntakeDataSchema = z.object({
  caller_name: z.string().optional(),
  caller_phone: z.string().optional(),
  caller_email: z.string().optional(),
  incident_date: z.string().optional(),
  incident_location: z.string().optional(),
  incident_description: z.string().optional(),
  incident_type: z.enum([
    'auto_accident', 'slip_and_fall', 'medical_malpractice',
    'workplace_injury', 'product_liability', 'other',
    'REFUSED', 'UNKNOWN'
  ]).optional(),
  injuries_described: z.string().optional(),
  treatment_status: z.enum([
    'currently_treating', 'completed_treatment', 'no_treatment', 'unknown',
    'REFUSED', 'UNKNOWN'
  ]).optional(),
  other_party_involved: z.union([z.boolean(), z.enum(['REFUSED', 'UNKNOWN'])]).optional(),
  fault_assessment: z.enum([
    'other_party_at_fault', 'shared_fault', 'self_fault', 'unclear',
    'REFUSED', 'UNKNOWN'
  ]).optional(),
  police_report_filed: z.union([z.boolean(), z.enum(['REFUSED', 'UNKNOWN'])]).optional(),
  insurance_info_available: z.union([z.boolean(), z.enum(['REFUSED', 'UNKNOWN'])]).optional(),
  other_party_insurance: z.string().optional(),
  own_insurance: z.string().optional(),
  is_qualified: z.union([z.boolean(), z.enum(['REFUSED', 'UNKNOWN'])]).optional(),
  qualification_reason: z.string().optional(),
  consent_given: z.union([z.boolean(), z.enum(['REFUSED', 'UNKNOWN'])]).optional(),
  call_ended_by_user: z.union([z.boolean(), z.enum(['REFUSED', 'UNKNOWN'])]).optional(),
});

export type IntakeData = z.infer<typeof IntakeDataSchema>;
