import type { IntakeData } from './schemas';

export type PhaseName =
  | 'GREETING'
  | 'INCIDENT_DETAILS'
  | 'INJURY_ASSESSMENT'
  | 'LIABILITY'
  | 'INSURANCE'
  | 'QUALIFICATION'
  | 'DISQUALIFICATION'
  | 'WRAP_UP';

export interface Phase {
  name: PhaseName;
  requiredFields: (keyof IntakeData)[];
  prompt: string;
  next: PhaseName | null;
}

export const INTAKE_PHASES: Record<PhaseName, Phase> = {
  GREETING: {
    name: 'GREETING',
    requiredFields: ['consent_given'],
    prompt: 'Greet the caller, introduce yourself as an AI assistant at SettleVox, state that your goal is to help connect them with a personal injury attorney at the earliest, and ask for their consent to record the call.',
    next: 'INCIDENT_DETAILS',
  },
  INCIDENT_DETAILS: {
    name: 'INCIDENT_DETAILS',
    requiredFields: ['incident_description', 'incident_date', 'incident_location'],
    prompt: 'Ask about the incident — what happened, when, and where. Ask one question at a time.',
    next: 'INJURY_ASSESSMENT',
  },
  INJURY_ASSESSMENT: {
    name: 'INJURY_ASSESSMENT',
    requiredFields: ['injuries_described', 'treatment_status'],
    prompt: 'Ask about their injuries and if they have received any medical treatment.',
    next: 'LIABILITY',
  },
  LIABILITY: {
    name: 'LIABILITY',
    requiredFields: ['other_party_involved', 'fault_assessment'],
    prompt: 'Determine liability gently — was another party involved and do they believe the other party was at fault?',
    next: 'INSURANCE',
  },
  INSURANCE: {
    name: 'INSURANCE',
    requiredFields: ['insurance_info_available'],
    prompt: 'Ask if they have insurance information for themselves or the other party.',
    next: 'QUALIFICATION',
  },
  QUALIFICATION: {
    name: 'QUALIFICATION',
    requiredFields: ['is_qualified'],
    prompt: 'Analyze the information. If they have injuries, another party is at fault, and there is insurance, they may be qualified. State that an attorney will need to review their case and call them back. Ask for their full name and best callback phone number.',
    next: 'WRAP_UP',
  },
  DISQUALIFICATION: {
    name: 'DISQUALIFICATION',
    requiredFields: ['qualification_reason', 'call_ended_by_user'],
    prompt: 'Politely inform the caller that based on the information provided, the firm may not be the best fit for their specific situation as there is no third-party liability. Ask if they have any other questions or if they would like to end the call. Only when the user says thank you, okay, or goodbye to explicitly confirm they want to end the call, say a final goodbye. Do NOT collect contact info or ask additional questions.',
    next: null,
  },
  WRAP_UP: {
    name: 'WRAP_UP',
    requiredFields: ['caller_email', 'call_ended_by_user'],
    prompt: 'Ask for their email address so an attorney can follow up. After collecting the email, ask if they have any other questions or if they would like to end the call. Only when the user explicitly confirms they want to end the call (e.g. says thank you, goodbye, okay), say a final goodbye.',
    next: null,
  },
};

export class IntakeFSM {
  private currentPhase: PhaseName = 'GREETING';
  private extractedData: Partial<IntakeData> = {};

  getCurrentPhase(): Phase {
    const phase = INTAKE_PHASES[this.currentPhase];
    if (phase.name === 'WRAP_UP' && this.extractedData.is_qualified === false) {
      return {
        ...phase,
        prompt: 'Politely inform the caller that the firm may not be the best fit for their specific situation, as there is no third-party liability. Do NOT collect contact info or ask questions. Ask if they have any other questions or if they would like to end the call. Only when the user explicitly confirms they want to end the call, say a final goodbye.'
      };
    }
    if (phase.name === 'DISQUALIFICATION' && this.extractedData.qualification_reason === 'consent_refused') {
      return {
        ...phase,
        prompt: 'The caller refused to be recorded. Acknowledge this politely, state that we cannot proceed with the automated intake without recording consent, and ask if they have any other questions. Only say a final goodbye and end the call after they explicitly confirm they have no more questions or want to end the call.'
      };
    }
    return phase;
  }

  getExtractedData(): Partial<IntakeData> {
    return this.extractedData;
  }

  updateData(newData: Partial<IntakeData>) {
    this.extractedData = { ...this.extractedData, ...newData };
    this.checkTransition();
  }

  private checkTransition() {
    // Fast-track logic for disqualified leads (no third-party liability)
    if (
      (this.extractedData.other_party_involved === false ||
        this.extractedData.fault_assessment === 'self_fault') &&
      this.currentPhase !== 'DISQUALIFICATION' &&
      this.currentPhase !== 'WRAP_UP'
    ) {
      this.extractedData.is_qualified = false;
      this.extractedData.qualification_reason = 'No third-party liability / occurred on own property.';
      this.extractedData.insurance_info_available = false; // Skip insurance collection
      // Jump to DISQUALIFICATION phase so agent can speak the decline message first
      this.currentPhase = 'DISQUALIFICATION';
      return;
    }

    // Fast-track logic for recording consent refusal
    if (
      (this.extractedData.consent_given === false || this.extractedData.consent_given === 'REFUSED') &&
      this.currentPhase !== 'DISQUALIFICATION' &&
      this.currentPhase !== 'WRAP_UP'
    ) {
      this.extractedData.is_qualified = false;
      this.extractedData.qualification_reason = 'consent_refused';
      this.currentPhase = 'DISQUALIFICATION';
      return;
    }

    let phase = this.getCurrentPhase();
    while (phase.next) {
      const allRequiredPresent = phase.requiredFields.every(field => this.extractedData[field] !== undefined);
      
      if (allRequiredPresent) {
        this.currentPhase = phase.next;
        phase = this.getCurrentPhase();
      } else {
        break;
      }
    }
  }
}
