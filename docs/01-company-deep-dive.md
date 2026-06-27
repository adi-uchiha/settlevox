# HelloCounsel: Company Deep Dive

## 🏢 Company Overview

| Field | Detail |
|:---|:---|
| **Legal Name** | HelloCounsel Technologies Private Limited (also: HelloCounsel Inc in the US) |
| **Founded** | January 30, 2026 (incorporated in Bangalore) |
| **HQ** | WeWork Embassy Quest, 45/1 Magrath Road, Ashok Nagar, Richmond Town, Bangalore 560025 |
| **US Phone** | +1 302-600-1530 |
| **CIN** | U62091KA2026PTC215138 |
| **Website** | hellocounsel.ai |
| **One-Liner** | AI voice agents for personal injury law firms |

---

## 💰 Funding

| Round | Amount | Date | Type |
|:---|:---|:---|:---|
| Seed | **$3.1M** (~$3.09M) | May 29, 2026 | Seed |

### Investors

| Investor | Background | Why It Matters |
|:---|:---|:---|
| **Akshay Kothari** | Co-founder & COO of Notion. Previously co-founded Pulse (acquired by LinkedIn for ~$90M). Stanford MS. Angel investor in CRED, Atlan, Pocus, Chroma, Drivetrain AI. | Silicon Valley product royalty. His investment signals strong product-market conviction. He's also a CRED investor, which connects to Krunal/Trupthi's CRED network. |
| **Larry Taylor** | Managing Partner at The Cochran Firm (Texas). Mass tort litigation leader. AI advocate — uses Supio AI in his practice. Named Lawdragon 500 Leading Plaintiff Consumer Lawyers. | Deep domain expertise. A law firm partner who *actually uses AI* investing in an AI legal tech startup = strong product validation from the demand side. |
| **Injury Board Ventures** | VC arm of The Injury Board — exclusive membership org for elite plaintiff trial attorneys (founded 2001, US/Canada/UK/Caribbean). | Direct pipeline to their customer base. This isn't just capital — it's distribution. Every member firm is a potential customer. |

### Key Insight for the Call
> Mention casually: *"The investor mix is interesting — Akshay Kothari from the product/tech side, Larry Taylor as an actual trial lawyer who uses AI, and Injury Board Ventures as a built-in distribution channel. That's a really strong cap table for a seed round."*

---

## 🛠️ Product: What HelloCounsel Does

### Core Product: AI Voice Agents ("Counsel")
HelloCounsel builds **AI workers** (they call them "Counsel") that handle phone communications for personal injury law firms.

### Two Main Functions:

#### 1. Inbound Calls (AI Receptionist + Intake)
- Answers every incoming call **24/7 instantly** — no hold times, no missed calls
- Conducts **structured intake interviews** against firm-specific qualification criteria
- Screens prospective clients (liability, injury severity, insurance coverage)
- **Routes qualified leads** to the appropriate attorney/paralegal via email + CMS
- Generates **TCPA-compliant** lead handling

#### 2. Outbound Calls (AI Administrative Worker)
- Follows up on **medical records**
- Tracks **active treatment status**
- Opens **insurance claims**
- Eliminates the need for paralegals to sit on hold waiting for insurance companies

### CMS Integrations (Critical Engineering Detail)
Every note is logged directly into the firm's Case Management System:
- **Filevine** (open API v2, highly customizable, enterprise-grade)
- **SmartAdvocate** (175+ pre-built integrations, PI-focused)
- **Litify** (Salesforce-based)
- **CASEpeer**
- **Neos**
- **MyCase**
- **LeadDocket**
- **Lawmatics**
- Custom integrations available

### Operational Details
- **Setup time:** 2–5 business days (HelloCounsel handles CMS integration, script config, training)
- **Data security:** Encrypted at rest and in transit
- **Pricing:** Not public — "Book a Call" / contact for quote model

---

## 🏗️ Likely Technical Architecture

Based on the product description and industry patterns, HelloCounsel likely uses:

### Voice Pipeline (The Core)
```
Phone Call (PSTN/SIP) → Telephony Layer (Twilio/Telnyx)
    → STT (Deepgram/Whisper - streaming)
        → LLM Brain (GPT-4/Claude/Gemini - with legal prompts)
            → TTS (ElevenLabs/PlayHT/Cartesia)
                → Audio back to caller
```

### Orchestration Options
- **Vapi** — developer-first, modular, bring-your-own-stack
- **Retell AI** — managed, optimized out-of-the-box
- **Bland.ai** — API-first, high-volume outbound
- **Custom-built** — most likely given they're hiring AI engineers

### State Management
- Long-running agents that maintain state across calls and workflows
- Checkpoint-and-resume patterns for multi-day legal workflows
- CMS write-back via API integrations

### Key Technical Challenges
1. **Latency** — humans expect <300ms response; the STT→LLM→TTS pipeline is additive
2. **Interruption handling** — callers talk over the AI; need adaptive VAD
3. **Hallucination prevention** — cannot fabricate case details or legal advice
4. **Multi-CMS integration** — each CMS has different schemas, auth, rate limits
5. **TCPA compliance** — AI voices are legally "artificial/prerecorded" (FCC Feb 2024 ruling); $500–$1,500 per violation
6. **Long-running state** — a case might span weeks/months; agent needs persistent memory

---

## 🏪 Market Context

### TAM
- Global Legal AI Market: **$2.75B–$5.21B** (2026), growing 11–34% CAGR
- PI law firms are **highest adopters** of AI intake (high-volume, repetitive, contingency-fee model)
- PPC costs for PI firms: **$200–$400 per click** → enormous pressure to convert every lead

### Why PI Firms Need This
- Every missed call = lost revenue (contingency fees mean the firm invests upfront)
- "Speed to lead" — respond within 5 minutes or lose the prospect
- Paralegals spend hours on hold with insurance companies → AI can eliminate this
- After-hours calls go to voicemail → competitors who answer instantly win

### Competitive Landscape

| Competitor | Model | Differentiator |
|:---|:---|:---|
| **Smith.ai** | Hybrid (AI + 500 human agents) | Market leader, 7,000+ tool integrations |
| **Answering Legal** | Human-only | 100% legal-trained staff |
| **Thoughtly** | AI-first | Lead conversion engine, voice/SMS/email |
| **LegalClerk.ai** | AI-first | High-volume PI, strict qualification |
| **Eve Legal** | AI-first | Plaintiff firms, Clio/MyCase integration |
| **CallCow** | AI-first | AI voice agent for lawyers |
| **Ruby Receptionists** | Human-only | Premium, warm experience |
| **LEX Reception** | Human-only | Boutique, legal-focused |

### HelloCounsel's Moat
1. **Deep CMS integration** — they don't just answer calls; they write structured data into 8+ CMS platforms
2. **PI vertical focus** — not a generic voice AI; built specifically for personal injury workflows
3. **Investor distribution** — Injury Board Ventures = built-in customer pipeline
4. **India engineering, US revenue** — cost arbitrage (high-value USD clients, INR engineering costs)
5. **Both inbound AND outbound** — most competitors do one or the other

---

## 📅 Company Timeline

| Date | Event |
|:---|:---|
| **Jan 30, 2026** | HelloCounsel Technologies Private Limited incorporated in Bangalore |
| **~Feb–Mar 2026** | Priyansh Agarwal joins as Founding AI Engineer |
| **~Mar–Apr 2026** | Product development, initial CMS integrations |
| **May 29, 2026** | **$3.1M Seed round** closes (Akshay Kothari, Larry Taylor, Injury Board Ventures) |
| **Jun 2026** | Actively hiring AI Engineers via ClanX; Crunchbase Growth Score 94, Heat Score 93 |
| **Jun 24, 2026** | You emailed, Krunal replied in 12 minutes and booked a call |

---

## 🔑 Things to Remember

1. Company is **less than 5 months old** — extremely early stage
2. **4 people total** — you'd be employee #5 or #6
3. **$3.1M in the bank** — well-capitalized for a seed-stage team this small
4. **6-day work week** — this is listed in the ClanX job posting
5. **Work from office** — Bangalore (WeWork Embassy Quest)
6. The rapid reply (12 min) + booking a call the same day = they're moving fast and are interested
