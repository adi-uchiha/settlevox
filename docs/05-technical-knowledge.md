# Technical Knowledge: Voice AI & Legal Intake

This document covers the technical concepts Krunal might discuss or expect you to know about. Read through it to sound informed — but don't pretend to be an expert on things you haven't built.

---

## 🎤 Voice AI Pipeline Architecture

### The Standard Pipeline
Every voice AI agent follows this real-time streaming architecture:

```
Phone Call (PSTN/SIP)
    ↓
Telephony Layer (Twilio, Telnyx, or custom SIP)
    ↓ (raw audio stream, 8kHz G.711 μ-law, via WebSocket)
Speech-to-Text / STT (Deepgram, Whisper, AssemblyAI)
    ↓ (streaming partial transcripts every ~50ms)
LLM Brain (GPT-4, Claude, Gemini — with legal system prompts)
    ↓ (streaming text response)
Text-to-Speech / TTS (ElevenLabs, PlayHT, Cartesia, XTTS)
    ↓ (streaming audio chunks)
Back to Phone Call
```

### Latency Budget
Humans expect responses in **200–300ms**. Anything past **800ms** feels broken. The pipeline is *additive*:
- STT: ~100–200ms
- LLM inference: ~200–500ms
- TTS: ~100–200ms
- Network overhead: ~50–100ms
- **Total: ~450–1000ms** (this is the core engineering challenge)

### Mitigation Strategies
- **Streaming everything:** Don't wait for full sentences; emit partial tokens and start TTS before the LLM finishes
- **Bridging phrases:** Pre-compute fillers like "Let me check that for you" to mask processing time
- **Edge deployment:** Deploy inference closer to the user to cut network round-trips
- **Caching:** Cache high-frequency responses (greetings, confirmations)
- **Measure P95/P99, not averages:** An agent with 200ms median but 2000ms P95 will frustrate users

---

## 🔄 Interruption Handling (Barge-In)

### The Problem
Conversations are **full-duplex** — humans talk over each other. The AI needs to:
1. Detect when the user is interrupting (not just coughing or saying "mm-hmm")
2. Immediately stop its current audio output
3. Process the interruption as a new input
4. NOT finish the old response after the interruption

### Voice Activity Detection (VAD)
- **Too sensitive:** Agent stops for every background noise
- **Too insensitive:** Agent talks over the user
- **Better approach:** Semantic detection — classify partial transcripts to determine if it's a real interruption or a backchannel

### State Flushing
When a valid interruption is detected, the system must:
1. Flush all pending TTS audio immediately
2. Cancel the current LLM generation
3. Re-enter the processing loop with the new user input
4. Maintain conversation context despite the interruption

---

## 🤥 Hallucination Prevention in Legal AI

### Why It's Critical
A voice agent for law firms **cannot**:
- Fabricate case details
- Give legal advice
- Claim a backend operation succeeded when it failed
- Make up insurance policy numbers or coverage amounts

### Architectural Solutions

1. **Code-over-Prompt:** Move critical business logic (qualification criteria, compliance rules) OUT of the LLM prompt and INTO hard-coded application logic
2. **Structured Output Validation:** Use Zod/Pydantic schemas to validate LLM output before acting on it (you did this in Kairos!)
3. **Multi-Agent Validation:** A "Critic" agent audits the primary agent's output against ground truth before the user hears it
4. **Graph RAG:** Ground responses in structured knowledge graphs, not just probabilistic LLM generation
5. **Guardrails:** Hard limits on what the agent can and cannot say (no legal advice, no fee discussions, no promises)

---

## 📋 Legal Intake Workflow (What HelloCounsel Automates)

### Phase 1: Immediate Lead Capture
- Respond within **5 minutes** (industry best practice)
- Answer every call 24/7 — no voicemail
- This is HelloCounsel's primary value prop for inbound

### Phase 2: Structured Qualification
The AI asks standardized questions to determine case viability:
- **Liability:** Who, what, where, when? Was the other party at fault?
- **Damages/Injuries:** What injuries? Currently receiving treatment?
- **Insurance:** Coverage details, all involved parties
- **Threshold Criteria:** Does this meet the firm's minimum case value?

### Phase 3: Conflict Check & Routing
- Check against existing clients (conflict of interest)
- Route to appropriate attorney based on case type
- Log everything into CMS

### Phase 4: Conversion
- Set expectations (contingency fees, timeline)
- Schedule follow-up or attorney consultation
- Execute representation agreement

### Why PI Firms Specifically?
- **Contingency fee model:** Firm invests upfront → every intake decision is a financial bet
- **High PPC costs:** $200–$400 per click → can't afford to miss a single lead
- **Volume business:** Unlike corporate law, PI is high-volume, repetitive intake
- **After-hours is critical:** Accidents don't happen 9–5; competitors who answer at 2 AM win

---

## 🔗 CMS Integration Deep Dive

### What the AI Needs to Do
After every call, the agent must:
1. Structure the conversation into **typed fields** (name, phone, injury type, accident date, etc.)
2. Map those fields to the **specific CMS schema** (each CMS has different field names and structures)
3. **Write** the data via API (REST, sometimes GraphQL)
4. Handle auth (API keys, OAuth, session tokens)
5. Handle failures gracefully (retry, queue, alert)

### Filevine API (The Main One)
- Open API v2
- Enterprise-grade, highly customizable
- Used by large PI firms
- Challenge: Custom fields are firm-specific — each installation has different schemas

### SmartAdvocate API
- 175+ pre-built integrations
- More "out of the box" than Filevine
- Specialized APIs for medical records retrieval and document delivery
- PI-focused

### Integration Challenges
- **Schema mismatch:** "Injury Type" in Filevine might be "InjuryCategory" in SmartAdvocate
- **Rate limiting:** APIs have different rate limits; need queuing/retry logic
- **Partial failures:** What happens when the call was logged but the CMS write failed?
- **Idempotency:** If the agent retries a CMS write, it shouldn't create duplicates
- **Webhook reliability:** If the CMS sends webhooks, you need to handle out-of-order delivery

---

## 🧪 Agent Evaluation & Testing

### Why Traditional Testing Fails
- AI agents are **non-deterministic** — same input can produce different outputs
- Prompt changes can cascade into unpredictable behavior changes
- Can't rely on single-run pass/fail tests

### Production-First Regression
1. **Golden Dataset:** Convert every production failure into a test case
2. **LLM-as-Judge:** Use an LLM to score the agent's output on accuracy, tone, and completeness
3. **Multi-Trial Evaluation:** Run the same test case 5x to capture variability
4. **Behavioral Drift Tracking:** Measure shifts on a spectrum, not binary pass/fail

### What HelloCounsel Likely Needs
- Eval infrastructure that catches regressions before deployment
- Test suites that simulate real legal intake conversations
- Monitoring that detects agent performance degradation in production
- A/B testing framework for prompt/model changes

---

## ⚖️ TCPA Compliance (Important Legal Context)

### What Is TCPA?
The Telephone Consumer Protection Act regulates automated/AI calling in the US.

### Key Facts
- FCC ruled in Feb 2024: **AI-generated voices = "artificial or prerecorded"** under TCPA
- This means AI voice agents must follow the same rules as robocalls
- **Penalties:** $500–$1,500 **per call** with no aggregate cap

### Requirements for HelloCounsel
- **Prior Express Consent** before outbound calls
- **Consent documentation** linked to the specific phone number
- **Do-Not-Call compliance** — scrub against national DNC registry
- **Opt-out mechanisms** — honor within 10 business days
- **Caller identification** — disclose who's calling and that it's AI

### Your Angle
> If TCPA comes up: *"I understand that TCPA compliance is a hard engineering constraint, not just a legal checkbox. Every outbound call needs consent verification at the time of dialing, which means the system needs to check consent records in real-time, not just rely on a policy document. That's the kind of infrastructure problem I'm good at building."*

---

## 🧠 Long-Running Agent State Management

### The Problem
A PI case can take **months**. The AI agent needs to:
- Remember context across multiple calls over weeks
- Track what it's already asked vs. what it still needs
- Handle cases where information changes mid-case
- Resume exactly where it left off after interruptions

### Key Patterns
1. **Checkpoint-and-Resume:** Persist state at stable boundaries; resume from last checkpoint on failure
2. **Durable Execution (Temporal):** Infrastructure manages state persistence; agent can pause for days and wake up exactly where it left off
3. **Tiered Memory:**
   - Short-term: current call context
   - Long-term: case history, previous calls, structured data (vector DB or relational)
4. **Idempotent Operations:** Retrying a step must not cause duplicates

### Frameworks
- **LangGraph** — stateful, graph-based orchestration
- **Temporal** — durable execution engine
- **CrewAI / AutoGen** — multi-agent collaboration
- **Custom** — most likely for HelloCounsel given their specific needs
