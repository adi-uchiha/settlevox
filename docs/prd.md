# Product Requirements Document (PRD)
# SettleVox — AI Voice Agent for Personal Injury Law Firms (HelloCounsel Demo Clone)

**Author:** Aditya (with Antigravity AI)
**Version:** 1.0
**Date:** 2026-06-26
**Status:** Draft — Pre-Implementation
**Purpose:** Impress Krunal Chauhan (CTO, HelloCounsel) by building a functional end-to-end voice AI agent that mirrors HelloCounsel's core product, demonstrating deep understanding of the problem space and engineering capability.

---

## Table of Contents

1. [Context & Motivation](#1-context--motivation)
2. [What is HelloCounsel?](#2-what-is-hellocounsel)
3. [Why We Are Building This](#3-why-we-are-building-this)
4. [What We Are Building](#4-what-we-are-building)
5. [Demo Dashboard (Authless Read-Only Portal)](#5-demo-dashboard-authless-read-only-portal)
6. [System Architecture](#6-system-architecture)
7. [Technical Implementation Plan](#7-technical-implementation-plan)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Cost Analysis](#9-cost-analysis)
10. [Risk Analysis & Mitigations](#10-risk-analysis--mitigations)
11. [Success Criteria](#11-success-criteria)
12. [Timeline](#12-timeline)
13. [Appendix: HelloCounsel Company Intel](#appendix-hellocounsel-company-intel)

---

## 1. Context & Motivation

### The Situation
Aditya cold-emailed Krunal Chauhan (Co-Founder & CTO, HelloCounsel) about the AI Engineer role. Krunal replied in **12 minutes** and booked a call via Aditya's Cal.com link on June 24, 2026. The call happened. Krunal asked Aditya to follow up.

### The Strategy
Instead of sending a resume and waiting, we are building a **functional prototype** of HelloCounsel's core product — an AI voice agent that handles legal intake calls for personal injury law firms. This demonstrates:

1. **Deep domain understanding** — we know what PI law firms need, how intake works, what TCPA compliance means
2. **Full-stack engineering capability** — telephony, real-time streaming, LLM orchestration, CMS integration
3. **Speed of execution** — built in 3 days by one person (with AI assistance), not 9 weeks
4. **Production thinking** — not a toy demo, but something with real error handling, state management, and observability

### The Deliverable
A shareable web URL that Krunal can open in his browser, enter his phone number, click a button, and receive a phone call from our AI legal intake agent. The agent will conduct a structured PI intake interview, qualify the caller, and log the results.

---

## 2. What is HelloCounsel?

### Company Overview

| Field | Detail |
|:---|:---|
| **Legal Name** | HelloCounsel Technologies Private Limited |
| **US Entity** | HelloCounsel Inc |
| **Founded** | January 30, 2026 (Bangalore) |
| **CIN** | U62091KA2026PTC215138 |
| **HQ** | WeWork Embassy Quest, 45/1 Magrath Road, Ashok Nagar, Richmond Town, Bangalore 560025 |
| **Website** | hellocounsel.ai |
| **One-liner** | AI voice agents for personal injury law firms |
| **Stage** | Seed ($3.1M raised May 29, 2026) |
| **Team Size** | 4 people |
| **Age** | ~5 months old |

### Founding Team

| Person | Role | Background |
|:---|:---|:---|
| **Krunal Chauhan** | Co-Founder & CTO | Ex-CRED founding team, NLP research (Gujarat University), Director of Forty Two AI Private Limited, DIN: 10991762 |
| **Trupthi Shetty** | Co-Founder & CEO | Ex-CRED (Lead for Growth & Engagement), angel investor (LearnApp Series A), IPL campaign strategist at CRED |
| **Priyansh Agarwal** | Founding AI Engineer | IIIT Delhi B.Tech CS (2023), ICPC World Finalist, AIR 1 Google Kick Start, Goldman Sachs intern, founder of TLE Eliminators |
| **Matt McCarren** | Director of Revenue/Partnerships | COO & Director of Business Affairs at Bey & Associates LLC (a PI law firm since 2015), domain expert |

### Investors

| Investor | Background | Strategic Value |
|:---|:---|:---|
| **Akshay Kothari** | Co-founder & COO of Notion, previously co-founded Pulse (acquired by LinkedIn for ~$90M), Stanford MS | Silicon Valley product royalty, CRED investor network |
| **Larry Taylor** | Managing Partner at The Cochran Firm (Texas), mass tort litigation leader, uses AI (Supio) in his practice | Product validation from the demand side — a law firm partner who actually uses AI |
| **Injury Board Ventures** | VC arm of The Injury Board — exclusive membership org for elite plaintiff trial attorneys (US/Canada/UK) | Built-in distribution channel. Every member firm is a potential customer |

### What HelloCounsel Does

HelloCounsel builds **AI voice workers** (called "Counsel") that handle phone communications for PI law firms:

#### Inbound Calls (AI Receptionist + Intake)
- Answers every incoming call **24/7 instantly** — zero hold times, zero missed calls
- Conducts **structured intake interviews** against firm-specific qualification criteria
- Screens prospective clients on liability, injury severity, insurance coverage
- Routes qualified leads to the appropriate attorney/paralegal via email + CMS
- Generates **TCPA-compliant** lead handling documentation

#### Outbound Calls (AI Administrative Worker)
- Follows up on **medical records** retrieval
- Tracks **active treatment status** with healthcare providers
- Opens **insurance claims** with carriers
- Eliminates hours of paralegal time spent on hold with insurance companies

#### CMS Integrations
Every call note is logged directly into the firm's Case Management System:
- **Filevine** (open API v2, highly customizable, enterprise-grade — custom fields per tenant)
- **SmartAdvocate** (175+ pre-built integrations, PI-focused, SOAP/REST API via `SAWebService.svc`)
- **Litify** (Salesforce-based)
- **CASEpeer**, **Neos**, **MyCase**, **LeadDocket**, **Lawmatics**
- Custom integrations available

---

## 3. Why We Are Building This

### 3.1 The Business Problem HelloCounsel Solves

Personal injury law firms operate on a **contingency fee model** — the firm invests upfront (investigator costs, medical experts, court filing fees) and gets paid only if they win the case (typically 33%–40% of the settlement). This creates extreme pressure on two fronts:

1. **Lead Capture Speed:** PI firms spend **$200–$400 per Google Ads click**. If a call goes to voicemail, the lead calls the next firm. Industry data shows that responding within **5 minutes** increases conversion by 100x compared to responding after 30 minutes.

2. **Administrative Overhead:** Paralegals spend **40%+ of their time** on hold with insurance companies requesting claim status updates, medical record retrieval confirmations, and treatment tracking. This is pure waste — a phone call where a human sits on hold for 20 minutes waiting for a carrier rep.

### 3.2 Why This is a Hard Engineering Problem

This is **not** a simple chatbot. The engineering challenges that make HelloCounsel interesting (and hard to replicate) are:

| Challenge | Why It's Hard |
|:---|:---|
| **Real-time latency** | The STT→LLM→TTS pipeline is additive. Humans expect <300ms response times. The pipeline can easily hit 900ms+ if not carefully optimized with streaming, caching, and fast models. |
| **Full-duplex interruption** | Callers interrupt the AI mid-sentence. The system must detect real interruptions vs. backchannels ("mm-hmm"), immediately flush the audio output buffer, cancel the LLM generation, and process the new input. Standard VAD + silence thresholds are too slow. |
| **Hallucination prevention** | The agent cannot fabricate case details, give legal advice, or claim a CMS write succeeded when it failed. This requires structured output validation (Pydantic/Zod), code-over-prompt patterns, and guardrail layers. |
| **Multi-CMS integration** | Each CMS has different API schemas, auth mechanisms (API keys, OAuth, session tokens), rate limits, and custom field naming conventions. Filevine tenants configure their own custom fields — there's no universal schema. |
| **TCPA compliance** | The FCC ruled in Feb 2024 that AI-generated voices = "artificial or prerecorded" under TCPA. Violations cost $500–$1,500 per call with no aggregate cap. Every outbound call must have real-time consent verification. |
| **Long-running state** | A PI case spans weeks or months. The agent must maintain context across multiple calls, track what it has already asked vs. what it still needs, handle information changes mid-case, and resume from exact checkpoints after interruptions. |

### 3.3 Why We Build This Demo Specifically

- **To Krunal:** This is the single most impactful thing we can do to prove engineering depth. Every other candidate will send a resume. We send a working product.
- **To Ourselves:** Building this forces us to learn the voice AI stack (Twilio, Deepgram, ElevenLabs, WebSockets, real-time streaming) — exactly what we'd work on at HelloCounsel.
- **The Moat:** If Krunal says "show me what you can build," we already have it running.

---

## 4. What We Are Building

### 4.1 Product Scope: The Demo MVP

We are building a **"Click-to-Talk" AI Legal Intake Agent** with three components:

#### Component 1: Web Portal (Frontend)
A premium, dark-themed single-page web app hosted on a public URL. Features:
- Phone number input with international country code selector (supporting +91 India and +1 US)
- A "Connect with AI Counsel" button that triggers a callback to the entered number
- Real-time call status indicator (Dialing → Ringing → Connected → Call Ended)
- Call summary display after the call ends (showing extracted intake data)
- Responsive design (works on mobile browsers)

#### Component 2: Voice Agent Backend (Server)
A Node.js/Python server that orchestrates the entire pipeline:
- **REST API endpoint** (`POST /api/request-call`) — receives the phone number from the frontend, triggers a Twilio outbound call
- **Twilio Webhook endpoint** (`POST /api/voice`) — when the callee answers, returns TwiML/instructions to upgrade the call to a WebSocket stream
- **WebSocket handler** (`/ws/media-stream`) — receives raw audio from Twilio, pipes it through the voice pipeline, and streams synthesized audio back

#### Component 3: Voice AI Pipeline (The Brain)
The real-time processing pipeline that makes the agent "think":
```
Raw Audio (8kHz G.711 μ-law from Twilio)
    ↓
Speech-to-Text (Deepgram Nova-2, streaming WebSocket)
    ↓ (partial transcripts every ~50ms)
LLM Brain (Gemini 2.0 Flash / GPT-4o-mini)
    ↓ (streaming tokens with structured legal prompts)
Text-to-Speech (Cartesia Sonic / ElevenLabs Flash)
    ↓ (streaming audio chunks)
Back to Twilio → Back to Caller's Phone
```

### 4.2 Feature Matrix: What's In vs. Out

| Feature | In MVP? | Notes |
|:---|:---|:---|
| Click-to-call callback from web portal | ✅ Yes | Core demo mechanic |
| AI conducts PI intake interview | ✅ Yes | Structured questions: accident details, injuries, insurance, liability |
| Real-time voice conversation (full-duplex) | ✅ Yes | Streaming STT→LLM→TTS |
| Barge-in / interruption handling | ✅ Yes | Audio buffer flush + LLM cancel on user speech |
| Structured data extraction (JSON) | ✅ Yes | Pydantic/Zod schema for intake fields |
| Call summary displayed on web portal | ✅ Yes | After call ends, show extracted case data |
| Mock CMS write (Filevine adapter) | ✅ Yes | Generic adapter pattern with mock backend |
| TCPA consent check (mock) | ✅ Yes | Demonstrate awareness, not production compliance |
| Real Filevine/SmartAdvocate API integration | ❌ No | Requires customer API keys we don't have |
| Outbound follow-up calls | ❌ No | Requires multi-day state management |
| Multi-language support | ❌ No | English only |
| Production-grade eval harness | ❌ No | Would build for real job, not demo |

### 4.3 The Legal Intake Flow (What the AI Says)

The agent follows a structured intake conversation flow modeled on real PI law firm SOPs:

```
Phase 1: Greeting & Disclosure
├── "Thank you for calling [Firm Name]. My name is Counsel, 
│    an AI assistant. I'll be gathering some initial information 
│    about your case today. This call may be recorded for quality 
│    purposes. Is that okay?"
│
Phase 2: Incident Details
├── "Can you tell me briefly what happened?"
├── "When did this incident occur?"
├── "Where did it take place — city and state?"
├── "Were there any witnesses?"
│
Phase 3: Injury Assessment
├── "Were you injured? Can you describe your injuries?"
├── "Have you received medical treatment?"
├── "Are you currently under a doctor's care?"
│
Phase 4: Liability Assessment
├── "Was another party involved?"
├── "In your view, was the other party at fault?"
├── "Was a police report filed?"
│
Phase 5: Insurance Information
├── "Do you have the other party's insurance information?"
├── "Do you have your own auto/health insurance?"
│
Phase 6: Qualification & Next Steps
├── [Internal: Run qualification rules against firm criteria]
├── IF QUALIFIED: "Based on what you've shared, I'd like to 
│    connect you with one of our attorneys. Can I get your 
│    full name, email, and best callback number?"
├── IF NOT QUALIFIED: "Thank you for sharing this with us. 
│    Based on our current criteria, we may not be the best 
│    fit for this particular situation, but I'd recommend..."
│
Phase 7: Wrap-Up
└── "Thank you, [Name]. An attorney from our team will be 
     reaching out to you within [timeframe]. Is there anything 
     else I can help you with today?"
```

---

## 5. Demo Dashboard (Authless Read-Only Portal)

> **Design Reference:** Modeled after the HelloCounsel dashboard UI (Overview, Calls list, and Call Detail views seen in product screenshots). This is a **read-only, authentication-free** companion portal to the "Click-to-Call" demo — it exists purely to impress Krunal by showing all call data in a polished, HelloCounsel-like interface.

### 5.1 Purpose & Rationale

The voice agent demo ends when the call hangs up and a call summary appears on the web portal. The Dashboard extends this by showing:
- **All historical calls** made through the demo (persisted in memory or SQLite)
- **Aggregate analytics** across all calls (total calls, avg talk time, outcomes)
- **Individual call drill-down** with transcript, AI summary, and extracted intake data

No login is required. The URL is publicly shareable. Anyone with the link can read all demo data. This mirrors HelloCounsel's own product dashboard exactly — which is the point.

### 5.2 Dashboard Views

The dashboard has **three views**, navigated via a left sidebar (just like HelloCounsel):

---

#### View 1: Overview (Home)

Inspired directly by the HelloCounsel "Good afternoon, Smith & Associates" overview screen.

**Header:**
- Firm name: `"SettleVox Demo — PI Intake AI"` (mirroring `"Good afternoon, Smith & Associates"`)
- Date range pill showing the demo period (e.g., `Jun 24 – Jun 26, 2026`)

**KPI Cards Row 1 (top row — 3 cards):**

| Card | Metric | What it Shows |
|:---|:---|:---|
| **Total Calls** | Count of all calls made | E.g., `12 (8 ANSWERED)` with `+100% vs last period` badge |
| **Talk Time** | Total audio duration across all calls | E.g., `1h 23m` |
| **Time Saved** | Estimated paralegal hours saved (1 call = 15 min of human work) | E.g., `3h 0m` with green `+100%` badge |

**KPI Cards Row 2 (second row — 3 cards):**

| Card | Metric | What it Shows |
|:---|:---|:---|
| **Qualification Rate** | % of calls where caller was marked `is_qualified: true` | With green `GOOD` or red `LOW` quality badge |
| **Intake Completion Rate** | % of calls that reached `WRAP_UP` phase | Shows avg completion across all calls |
| **Transfer Answer Rate** | % of calls where caller provided contact info | With a breakdown of `connected` vs `no answer` below |

**Charts Row:**

| Chart | Type | Data |
|:---|:---|:---|
| **Daily Activity** | Bar chart (vertical) | Number of calls per day over the demo period. X-axis = date, Y-axis = call count. Shows avg calls/day. |
| **Actions Taken** | Donut/pie chart | Breakdown of call outcomes: `Qualified` / `Unqualified` / `Incomplete` / `Error`. Legend shows percentages. |

---

#### View 2: Calls List

Inspired by the HelloCounsel "Recent Calls" table view.

**Left panel — Calls Table:**

| Column | Data |
|:---|:---|
| **Date/Time** | e.g., `JUN 26 · 3:35P` |
| **Caller** | Phone number dialed (masked: `+91 ●●●●● 54321`) |
| **Type** | Incident type badge: `AUTO ACCIDENT`, `SLIP & FALL`, `MEDICAL`, `UNKNOWN` — colored pills |
| **Phone** | Full phone (partially masked for privacy) |
| **Duration** | `1m 5s`, `3m 22s`, etc. |
| **Status tag** | `COMPLETED`, `INCOMPLETE`, `ERROR` — colored badge |

Rows are clickable → navigates to View 3 (Call Detail).
Current active row is highlighted (matching HelloCounsel's row highlight style).

**Right panel — Aggregate mini-charts:**
- **Actions Taken** donut (same as Overview, refreshed per filtered selection)
- **Volume by Type** stacked bar chart — calls broken down by incident type (`AUTO`, `SLIP`, `MED`, `OTHER`) per day

---

#### View 3: Call Detail

Inspired by the HelloCounsel `CALLS / CALL #1006` single-call view.

**Page header:**
- Breadcrumb: `CALLS / CALL #[id]`
- Caller display name (if captured): `[Unknown Caller]` or extracted name from intake
- Status badge: `● COMPLETED` / `⚠ INCOMPLETE` / `✕ ERROR`
- Phone number, date, time, duration

**Left panel (main content):**

| Section | Content |
|:---|:---|
| **Qualification Result** | Green `QUALIFIED` or red `UNQUALIFIED` badge with `qualification_reason` text |
| **AI Summary** | 2–3 sentence plain-English summary of the call generated by the LLM at call end. E.g., *"Caller was involved in a rear-end collision on June 24th in Dallas, TX. They sustained back injuries and are currently under medical care. Transferred to attorney queue as a qualified lead."* |
| **Transcript** | Full turn-by-turn transcript. Each line labeled `AGENT – COUNSEL` or `CALLER`. Alternating row highlight for readability. |

**Right panel (sidebar):**

| Section | Content |
|:---|:---|
| **Recording** | Audio player widget with play/pause, seek bar, duration, and playback speed selector (0.75x, 1x, 1.5x, 2x). Plays the actual call recording if Twilio call recording is enabled; otherwise shows "Recording unavailable in demo." |
| **Call Details** | `Call ID`, `Status`, `Outcome` (Qualified/Unqualified), `Incident Type`, `Sentiment` (NEUTRAL/POSITIVE/NEGATIVE — from LLM analysis) |
| **Extracted Intake Data** | Structured JSON fields rendered as labeled rows: `incident_date`, `incident_location`, `incident_description`, `injuries_described`, `treatment_status`, `fault_assessment`, `police_report_filed`, `insurance_info_available`, `caller_name`, `caller_email` |
| **Export** | Two buttons: `Download Transcript (.txt)` and `Download Intake JSON (.json)` — both trigger client-side file downloads |

---

### 5.3 Dashboard Navigation (Sidebar)

Left sidebar — fixed, always visible:

```
┌──────────────────────┐
│  🎙 SettleVox        │  ← logo + product name
├──────────────────────┤
│  ▣  Overview         │  ← View 1
│  ☎  Calls            │  ← View 2
│  ✦  Records          │  ← alias for Calls, shows structured intake cards
├──────────────────────┤
│  [Demo Firm]         │  ← bottom user pill
│  DEMO MODE           │
└──────────────────────┘
```

---

### 5.4 Data Layer (How Dashboard Gets Its Data)

The dashboard reads from the **same in-memory / SQLite store** that the voice agent writes to after every call.

**Data written per call (by `orchestrator.js` after call ends):**

```json
{
  "call_id": "CA_abc123",
  "phone_number": "+919876543210",
  "started_at": "2026-06-26T10:05:00Z",
  "ended_at": "2026-06-26T10:08:23Z",
  "duration_seconds": 203,
  "status": "completed",
  "final_phase": "WRAP_UP",
  "ai_summary": "...",
  "transcript": [
    { "speaker": "agent", "text": "Thank you for calling...", "timestamp": 0.0 },
    { "speaker": "caller", "text": "Hi, I was in a car accident...", "timestamp": 4.2 }
  ],
  "extracted_data": {
    "incident_type": "auto_accident",
    "incident_date": "2026-06-20",
    "incident_location": "Dallas, TX",
    "injuries_described": "Back and neck pain",
    "treatment_status": "currently_treating",
    "other_party_involved": true,
    "fault_assessment": "other_party_at_fault",
    "police_report_filed": true,
    "insurance_info_available": true,
    "is_qualified": true,
    "qualification_reason": "Clear liability, documented injuries, active treatment",
    "caller_name": "Michael Torres",
    "caller_email": "michael@example.com",
    "caller_phone": "+919876543210",
    "consent_given": true
  },
  "sentiment": "neutral",
  "recording_url": null
}
```

**API endpoints serving the dashboard (added to `server.js`):**

| Endpoint | Method | Returns |
|:---|:---|:---|
| `/api/calls` | GET | Array of all call records (summary fields only — no transcript) |
| `/api/calls/:id` | GET | Full call record including transcript and extracted data |
| `/api/stats` | GET | Aggregate stats: total calls, total duration, qualification rate, calls-per-day, outcome breakdown |

All endpoints return JSON. No auth headers required. CORS open.

---

### 5.5 Frontend Implementation

**Technology:** Vanilla HTML + CSS + JS (single-page app, no framework). Same `public/` folder as the call portal, but a separate page at `/dashboard`.

**Key libraries (CDN-linked, no npm):**
- **Chart.js** — for bar charts and donut charts
- **Phosphor Icons** — for sidebar icons (matching the aesthetic)
- No other dependencies

**Design System (matching HelloCounsel aesthetic):**

```css
/* Color Palette */
--bg-primary: #0f0f0f;         /* near-black background */
--bg-card: #1a1a1a;            /* card surface */
--bg-card-hover: #222222;      /* card hover */
--accent-gold: #c9a84c;        /* HelloCounsel-style warm gold for charts */
--accent-teal: #2a7a7a;        /* secondary chart color */
--text-primary: #f5f5f5;
--text-secondary: #888888;
--border: #2a2a2a;

/* Status Colors */
--status-completed: #22c55e;   /* green */
--status-incomplete: #f59e0b;  /* amber */
--status-error: #ef4444;       /* red */
--qualified: #22c55e;
--unqualified: #ef4444;

/* Typography */
font-family: 'Inter', sans-serif;
```

**File structure additions:**

```
public/
├── dashboard.html          ← [NEW] Dashboard SPA entry point
├── dashboard.css           ← [NEW] Dashboard-specific styles
└── dashboard.js            ← [NEW] Dashboard logic: routing, data fetching, chart rendering
```

**Routing (client-side, hash-based):**

```
/dashboard                  → Overview (View 1)
/dashboard#calls            → Calls List (View 2)
/dashboard#calls/:id        → Call Detail (View 3)
```

---

### 5.6 Dashboard Feature Matrix

| Feature | Included? | Notes |
|:---|:---|:---|
| Overview KPI cards | ✅ Yes | Total calls, talk time, time saved, qualification rate |
| Daily activity bar chart | ✅ Yes | Chart.js bar chart, calls per day |
| Actions taken donut chart | ✅ Yes | Chart.js donut, outcome breakdown |
| Calls table with status badges | ✅ Yes | All calls, paginated if >20 |
| Volume by type stacked bar | ✅ Yes | Chart.js stacked bar, incident type breakdown |
| Individual call detail view | ✅ Yes | Transcript, AI summary, extracted data |
| Audio playback widget | ✅ Yes | HTML5 `<audio>` player; falls back gracefully if no recording |
| Export transcript (.txt) | ✅ Yes | Client-side Blob download |
| Export intake JSON (.json) | ✅ Yes | Client-side Blob download |
| Authentication / login | ❌ No | Demo only — authless by design |
| Real-time auto-refresh | ✅ Yes | Polls `/api/calls` every 10 seconds; highlights new rows |
| Date range filter | 🟡 Stretch | Nice to have; low priority for demo |
| Firm switcher / multi-tenant | ❌ No | Single demo firm only |

---

## 6. System Architecture

### 6.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        KRUNAL'S BROWSER                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Web Portal (HTML/CSS/JS)                                    │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│    │
│  │  │ Phone Input      │  │ "Call Me" Button │  │ Status Panel ││    │
│  │  │ +91 XXXXXXXXXX   │  │   ► Connect     │  │ ● Dialing... ││    │
│  │  └─────────────────┘  └────────┬────────┘  └──────────────┘│    │
│  └────────────────────────────────┼────────────────────────────┘    │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │ HTTPS POST /api/request-call
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     APPLICATION SERVER (Render/Fly.io)                │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Express.js / FastAPI                                           │ │
│  │                                                                 │ │
│  │  POST /api/request-call ──► Twilio REST API ──► Dial Phone     │ │
│  │  POST /api/voice        ◄── Twilio Webhook  ──► Return TwiML   │ │
│  │  WS   /ws/media-stream  ◄── Twilio Media Streams (bidirectional)│ │
│  └──────────┬──────────────────────┬───────────────────┬───────────┘ │
│             │                      │                   │             │
│             ▼                      ▼                   ▼             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  STT Module      │  │  LLM Module      │  │  TTS Module      │   │
│  │  (Deepgram WS)   │  │  (Gemini Flash)  │  │  (Cartesia/11L)  │   │
│  │                  │  │                  │  │                  │   │
│  │  Raw Audio ──►   │  │  Transcript ──►  │  │  Tokens ──►      │   │
│  │  Partial Text    │  │  Response Tokens  │  │  Audio Chunks    │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│             │                      │                   │             │
│             └──────────────────────┴───────────────────┘             │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  State Manager                                                  │ │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │ │
│  │  │ Intake FSM   │  │ Schema Validator  │  │ Mock CMS Writer  │  │ │
│  │  │ (Phase 1→7)  │  │ (Pydantic/Zod)   │  │ (Filevine Mock)  │  │ │
│  │  └──────────────┘  └──────────────────┘  └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Twilio PSTN Call
                                    ▼
                        ┌──────────────────┐
                        │  KRUNAL'S PHONE  │
                        │  +91 XXXXXXXXXX  │
                        │  📱 Ringing...   │
                        └──────────────────┘
```

### 6.2 Data Flow: A Single Call Lifecycle

```
Timeline (milliseconds)
─────────────────────────────────────────────────────────────────────

t=0ms      Krunal clicks "Call Me" on web portal
t=50ms     Frontend sends POST /api/request-call { phone: "+91..." }
t=100ms    Server calls Twilio API: client.calls.create(...)
t=200ms    Twilio initiates outbound PSTN call to +91 number
t=2000ms   Krunal's phone rings
t=5000ms   Krunal answers
t=5050ms   Twilio hits POST /api/voice webhook
t=5100ms   Server returns TwiML: <Connect><Stream url="wss://..." /></Connect>
t=5150ms   Twilio opens bidirectional WebSocket to /ws/media-stream
t=5200ms   Raw audio starts flowing (8kHz G.711 μ-law, base64 encoded)

           ┌─── CONVERSATION LOOP (repeats for each turn) ──────────┐
           │                                                         │
t+0ms      │  Audio chunk received from Twilio WebSocket             │
t+10ms     │  Forwarded to Deepgram streaming WebSocket              │
t+80ms     │  Deepgram emits partial transcript (interim result)     │
t+120ms    │  Deepgram emits final transcript for utterance          │
t+130ms    │  Transcript fed to LLM with system prompt + state       │
t+150ms    │  LLM starts streaming response tokens                   │
t+180ms    │  First tokens forwarded to TTS engine                   │
t+250ms    │  TTS emits first audio chunk                            │
t+260ms    │  Audio chunk sent back through Twilio WebSocket         │
t+280ms    │  Krunal hears the agent start speaking                  │
           │                                                         │
           │  Total perceived latency: ~160ms (after transcript)     │
           │  Total TTFA from end of speech: ~300-500ms              │
           └─────────────────────────────────────────────────────────┘

t=end      Call ends → Server extracts structured intake data
           → Writes to Mock CMS → Pushes summary to web portal via SSE
```

### 6.3 Latency Budget

| Component | Target Latency | Provider | Notes |
|:---|:---|:---|:---|
| STT (Speech-to-Text) | 80–120ms | Deepgram Nova-2 | Streaming WebSocket, partial transcripts every ~50ms |
| LLM (Time-to-First-Token) | 150–250ms | Gemini 2.0 Flash | Cached system prompt, streaming tokens |
| TTS (Time-to-First-Audio) | 60–100ms | Cartesia Sonic | Ultra-low latency, streaming chunks |
| Network (Twilio ↔ Server) | 20–50ms | Render/Fly.io US-East | Co-located with Twilio's US infrastructure |
| Network (Twilio ↔ India) | 150–200ms | PSTN international | Unavoidable transcontinental delay |
| **Total TTFA (US caller)** | **~350–520ms** | — | Acceptable, feels conversational |
| **Total TTFA (India caller)** | **~500–720ms** | — | Slight delay, acceptable for demo |

---

## 7. Technical Implementation Plan

### 7.1 Project Structure

```
hellocounsel-demo/
├── package.json
├── .env.example              # Template for API keys
├── .env                      # Actual secrets (gitignored)
├── server.js                 # Main Express server
├── public/                   # Static frontend files
│   ├── index.html            # Web portal UI
│   ├── style.css             # Premium dark theme styles
│   └── app.js                # Frontend logic (fetch + status updates)
├── src/
│   ├── telephony/
│   │   ├── twilio-handler.js # Twilio webhook + call initiation
│   │   └── media-stream.js   # WebSocket handler for Twilio Media Streams
│   ├── pipeline/
│   │   ├── stt.js            # Deepgram streaming client
│   │   ├── llm.js            # LLM client (Gemini/OpenAI) with streaming
│   │   ├── tts.js            # TTS client (Cartesia/ElevenLabs) with streaming
│   │   └── orchestrator.js   # Pipeline coordinator (STT→LLM→TTS loop)
│   ├── agent/
│   │   ├── intake-fsm.js     # Finite State Machine for intake conversation flow
│   │   ├── prompts.js        # System prompts and phase-specific instructions
│   │   ├── schemas.js        # Zod schemas for structured intake data extraction
│   │   └── guardrails.js     # Response filtering (no legal advice, no hallucination)
│   ├── integrations/
│   │   ├── cms-adapter.js    # Generic CMS adapter interface
│   │   ├── filevine-mock.js  # Mock Filevine API (simulates real schema)
│   │   └── smart-advocate-mock.js  # Mock SmartAdvocate API
│   └── utils/
│       ├── audio.js          # Audio encoding/decoding (μ-law ↔ PCM)
│       ├── logger.js         # Structured logging (Pino)
│       └── config.js         # Environment variable validation
├── tests/
│   ├── pipeline.test.js      # Unit tests for pipeline components
│   ├── intake-fsm.test.js    # FSM state transition tests
│   └── golden-dataset/       # Pre-recorded test conversations
│       ├── qualified-lead.json
│       ├── unqualified-lead.json
│       └── edge-case-interruption.json
└── docs/
    └── 07-PRD-voice-agent-demo.md  # This document
```

### 7.2 Module-by-Module Implementation

---

#### 7.2.1 Telephony Layer (`src/telephony/`)

**File: `twilio-handler.js`**

Purpose: Handles two critical flows:
1. **Initiating outbound calls** when the web portal sends a phone number
2. **Returning TwiML** when Twilio asks what to do after the callee answers

```javascript
// Pseudocode — actual implementation will be production-grade

// POST /api/request-call
async function requestCall(req, res) {
  const { phoneNumber } = req.body;
  
  // Validate phone number format (E.164)
  if (!isValidE164(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }
  
  // Create outbound call via Twilio
  const call = await twilioClient.calls.create({
    to: phoneNumber,                    // e.g., "+919876543210"
    from: process.env.TWILIO_PHONE_NUMBER, // e.g., "+14155551234"
    url: `${process.env.BASE_URL}/api/voice`,  // Webhook when answered
    statusCallback: `${process.env.BASE_URL}/api/call-status`,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
  });
  
  return res.json({ callSid: call.sid, status: 'initiated' });
}

// POST /api/voice (Twilio webhook — called when the person answers)
function voiceWebhook(req, res) {
  const twiml = new VoiceResponse();
  const connect = twiml.connect();
  
  // Upgrade to bidirectional WebSocket media stream
  connect.stream({
    url: `wss://${process.env.HOST}/ws/media-stream`,
    name: 'ai-agent-stream',
  });
  
  res.type('text/xml');
  res.send(twiml.toString());
}
```

**File: `media-stream.js`**

Purpose: Handles the raw WebSocket connection from Twilio Media Streams. This is the bridge between the phone call and our AI pipeline.

Key responsibilities:
- Parse incoming `media` events (base64-encoded audio chunks)
- Forward decoded audio to the STT module
- Receive synthesized audio from the TTS module
- Send audio back to Twilio as base64-encoded `media` events
- Handle `start`, `stop`, and `mark` events for synchronization

```javascript
// Pseudocode for WebSocket handler

wss.on('connection', (ws) => {
  const session = new AgentSession(ws);
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.event) {
      case 'start':
        // Twilio tells us the stream parameters (codec, sample rate)
        session.initialize(data.start);
        break;
        
      case 'media':
        // Raw audio chunk (base64 encoded, μ-law, 8kHz)
        const audioBuffer = Buffer.from(data.media.payload, 'base64');
        session.processAudio(audioBuffer);
        break;
        
      case 'stop':
        // Call ended
        session.finalize();
        break;
    }
  });
});
```

---

#### 7.2.2 Voice Pipeline (`src/pipeline/`)

**File: `stt.js` — Speech-to-Text**

Provider: **Deepgram Nova-2** via WebSocket streaming API.

Key design decisions:
- Use `interim_results: true` for real-time partial transcripts (enables responsive interruption detection)
- Use `endpointing: 300` (300ms of silence = end of utterance) — this is the turn-taking threshold
- Use `utterance_end_ms: 1000` as a fallback silence detector
- Audio format: 8kHz, μ-law (matching Twilio's output directly — no re-encoding needed)

```javascript
// Connection parameters
const deepgramConfig = {
  model: 'nova-2',
  language: 'en-US',
  smart_format: true,
  interim_results: true,
  utterance_end_ms: 1000,
  endpointing: 300,
  encoding: 'mulaw',
  sample_rate: 8000,
  channels: 1,
};
```

**File: `llm.js` — Language Model**

Provider: **Google Gemini 2.0 Flash** (primary) or **OpenAI GPT-4o-mini** (fallback).

Key design decisions:
- Use streaming (`stream: true`) to get tokens as fast as possible
- System prompt includes the current conversation phase, extracted data so far, and firm-specific qualification criteria
- Response is forced into a structured format: `{ speech: "...", extracted_data: {...}, next_phase: "..." }`
- Temperature set to 0.3 (low creativity — we want consistent, professional responses)
- Max tokens capped at 150 per turn (prevents monologuing)

**File: `tts.js` — Text-to-Speech**

Provider: **Cartesia Sonic** (primary) or **ElevenLabs Flash** (fallback).

Key design decisions:
- Use WebSocket streaming — feed tokens as they arrive from the LLM, don't wait for the full sentence
- Voice: Professional, warm, American English female voice (matching legal receptionist expectations)
- Output format: 8kHz μ-law (to match Twilio's expected input — no transcoding needed)
- Implement a **sentence buffer**: accumulate tokens until a sentence boundary (`.`, `?`, `!`) before sending to TTS, to avoid choppy mid-word synthesis

**File: `orchestrator.js` — Pipeline Coordinator**

This is the most critical file. It manages the real-time flow and handles:

1. **Normal turn flow:** User speaks → STT transcribes → LLM responds → TTS synthesizes → Audio plays
2. **Interruption (barge-in) flow:**
   - While TTS audio is playing, if STT detects new user speech:
     1. Immediately send a `clear` message to Twilio to stop audio playback
     2. Cancel the current LLM generation stream
     3. Flush the TTS audio queue
     4. Feed the new user transcript to the LLM with context about what was interrupted
3. **Silence handling:** If no speech is detected for 8 seconds, generate a gentle prompt ("Are you still there?")
4. **Error recovery:** If any pipeline component fails, gracefully inform the caller and log the error

```javascript
// Simplified orchestrator pseudocode

class PipelineOrchestrator {
  constructor(twilioWs, deepgramWs, llmClient, ttsClient, intakeFSM) {
    this.isAgentSpeaking = false;
    this.currentLLMStream = null;
    this.audioQueue = [];
  }

  async onTranscript(transcript, isFinal) {
    if (!isFinal) {
      // Interim result — check for interruption
      if (this.isAgentSpeaking && transcript.length > 3) {
        this.handleBargeIn();
      }
      return;
    }

    // Final transcript — process the user's complete utterance
    const phase = this.intakeFSM.getCurrentPhase();
    const context = this.intakeFSM.getContext();
    
    // Get LLM response (streaming)
    this.currentLLMStream = await this.llmClient.stream({
      systemPrompt: buildSystemPrompt(phase, context),
      userMessage: transcript,
    });

    // Stream tokens to TTS as they arrive
    this.isAgentSpeaking = true;
    let sentenceBuffer = '';
    
    for await (const token of this.currentLLMStream) {
      sentenceBuffer += token;
      
      if (isSentenceEnd(sentenceBuffer)) {
        const audioChunks = await this.ttsClient.synthesize(sentenceBuffer);
        this.sendAudioToTwilio(audioChunks);
        sentenceBuffer = '';
      }
    }
    
    this.isAgentSpeaking = false;
    
    // Update FSM state with extracted data
    this.intakeFSM.processResponse(transcript, llmResponse);
  }

  handleBargeIn() {
    // 1. Stop audio playback
    this.twilioWs.send(JSON.stringify({ event: 'clear', streamSid: this.streamSid }));
    
    // 2. Cancel LLM generation
    if (this.currentLLMStream) {
      this.currentLLMStream.cancel();
    }
    
    // 3. Flush audio queue
    this.audioQueue = [];
    this.isAgentSpeaking = false;
  }
}
```

---

#### 7.2.3 Agent Logic (`src/agent/`)

**File: `intake-fsm.js` — Finite State Machine**

The conversation is modeled as a state machine with 7 phases:

```
GREETING → INCIDENT_DETAILS → INJURY_ASSESSMENT → LIABILITY → 
INSURANCE → QUALIFICATION → WRAP_UP
```

Each phase has:
- A list of required data fields (e.g., `INCIDENT_DETAILS` needs `incident_date`, `incident_location`, `incident_description`)
- Transition rules: move to the next phase when all required fields are extracted OR when the LLM determines the user has provided enough information
- Fallback logic: if the user goes off-topic, gently redirect them back

```javascript
const INTAKE_PHASES = {
  GREETING: {
    requiredFields: ['consent_given'],
    prompt: 'Greet the caller, introduce yourself as an AI assistant, and ask for consent to record.',
    next: 'INCIDENT_DETAILS',
  },
  INCIDENT_DETAILS: {
    requiredFields: ['incident_description', 'incident_date', 'incident_location'],
    prompt: 'Ask about the incident — what happened, when, and where.',
    next: 'INJURY_ASSESSMENT',
  },
  INJURY_ASSESSMENT: {
    requiredFields: ['injuries_described', 'treatment_status'],
    prompt: 'Ask about injuries and medical treatment.',
    next: 'LIABILITY',
  },
  LIABILITY: {
    requiredFields: ['other_party_involved', 'fault_assessment'],
    prompt: 'Determine liability — was another party at fault?',
    next: 'INSURANCE',
  },
  INSURANCE: {
    requiredFields: ['insurance_info_available'],
    prompt: 'Gather insurance information from both parties.',
    next: 'QUALIFICATION',
  },
  QUALIFICATION: {
    requiredFields: ['is_qualified'],
    prompt: 'Run qualification criteria and provide next steps.',
    next: 'WRAP_UP',
  },
  WRAP_UP: {
    requiredFields: ['caller_name', 'caller_email', 'caller_phone'],
    prompt: 'Collect contact information and wrap up the call.',
    next: null, // Terminal state
  },
};
```

**File: `prompts.js` — System Prompts**

The system prompt is dynamically assembled based on the current FSM phase:

```javascript
function buildSystemPrompt(phase, context) {
  return `
You are Counsel, an AI legal intake specialist working for a personal injury law firm.

## Your Role
- You are conducting a structured intake interview for a potential personal injury case.
- You are NOT a lawyer. You do NOT give legal advice. Ever.
- You are warm, professional, and empathetic. Callers are often in distress.
- Keep responses under 2 sentences. Be concise. Do not monologue.

## Current Phase: ${phase.name}
${phase.prompt}

## Required Information Still Needed:
${phase.requiredFields.filter(f => !context[f]).join(', ')}

## Information Already Collected:
${JSON.stringify(context.extractedData, null, 2)}

## Rules (NEVER VIOLATE):
1. NEVER fabricate case details or claim something happened that wasn't stated.
2. NEVER provide legal advice or opinions on case strength.
3. NEVER discuss fees, costs, or settlement amounts.
4. NEVER promise outcomes.
5. If the caller asks something you cannot answer, say: "That's a great question for the attorney. I'll make sure they address it when they call you back."
6. If the caller is in immediate danger, instruct them to call 911 immediately.

## Response Format:
Respond naturally as if speaking on the phone. Do not use markdown, bullet points, or formatting.
  `.trim();
}
```

**File: `schemas.js` — Structured Data Extraction**

After each phase, the LLM is asked to extract structured data. We validate this with Zod:

```javascript
const IntakeDataSchema = z.object({
  caller_name: z.string().optional(),
  caller_phone: z.string().optional(),
  caller_email: z.string().email().optional(),
  incident_date: z.string().optional(),        // ISO date or natural language
  incident_location: z.string().optional(),     // City, State
  incident_description: z.string().optional(),  // Free-text summary
  incident_type: z.enum([
    'auto_accident', 'slip_and_fall', 'medical_malpractice',
    'workplace_injury', 'product_liability', 'other'
  ]).optional(),
  injuries_described: z.string().optional(),
  treatment_status: z.enum([
    'currently_treating', 'completed_treatment', 'no_treatment', 'unknown'
  ]).optional(),
  other_party_involved: z.boolean().optional(),
  fault_assessment: z.enum([
    'other_party_at_fault', 'shared_fault', 'self_fault', 'unclear'
  ]).optional(),
  police_report_filed: z.boolean().optional(),
  insurance_info_available: z.boolean().optional(),
  other_party_insurance: z.string().optional(),
  own_insurance: z.string().optional(),
  is_qualified: z.boolean().optional(),
  qualification_reason: z.string().optional(),
  consent_given: z.boolean().optional(),
});
```

**File: `guardrails.js` — Response Filtering**

A post-processing layer that checks the LLM's response before it goes to TTS:

```javascript
const BLOCKED_PATTERNS = [
  /your case is worth/i,
  /you (should|could|will) (get|receive|win)/i,
  /settlement.*\$[\d,]+/i,
  /I (am|'m) (a|your) lawyer/i,
  /legal advice/i,
  /guaranteed/i,
  /definitely win/i,
  /contingency fee/i,
];

function filterResponse(text) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return "That's a great question for the attorney. I'll make sure they address it when they call you back.";
    }
  }
  return text;
}
```

---

#### 7.2.4 CMS Integration (`src/integrations/`)

**File: `cms-adapter.js` — Generic Interface**

```javascript
class CMSAdapter {
  async createLead(intakeData) { throw new Error('Not implemented'); }
  async updateLead(leadId, data) { throw new Error('Not implemented'); }
  async getLeadStatus(leadId) { throw new Error('Not implemented'); }
}
```

**File: `filevine-mock.js` — Mock Filevine API**

Simulates Filevine's v2 API behavior:
- `/customs/metadata` — returns the tenant's custom field definitions
- `/contacts` — creates a new contact
- `/projects` — creates a new project (case)
- `/projects/{id}/sections/{sectionId}` — writes intake data to a custom section

The mock stores data in-memory (or a local SQLite file) and returns responses matching Filevine's actual API response format. This proves to Krunal that the system is designed for a real CMS swap via a single environment variable change.

---

## 8. Infrastructure & Deployment

### 8.1 Deployment Architecture

```
┌──────────────────────┐     ┌──────────────────────┐
│   Render.com          │     │   Twilio              │
│   (App Server)        │◄───►│   (Telephony)         │
│                       │     │                       │
│   Express.js          │     │   US Number: +1...    │
│   WebSocket Server    │     │   Media Streams       │
│   Static Frontend     │     │   Geo Perms: India ✓  │
└───────┬──────┬────────┘     └───────────────────────┘
        │      │
        │      │ WebSocket / REST
        ▼      ▼
┌──────────┐ ┌──────────────┐ ┌──────────────────────┐
│ Deepgram │ │ Gemini Flash │ │ Cartesia / ElevenLabs│
│ (STT)    │ │ (LLM)        │ │ (TTS)                │
└──────────┘ └──────────────┘ └──────────────────────┘
```

### 8.2 Deployment Steps

1. **Push code to GitHub** (private repo)
2. **Connect to Render.com** (free tier for web services)
3. **Set environment variables** in Render dashboard:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
   - `DEEPGRAM_API_KEY`
   - `GEMINI_API_KEY` or `OPENAI_API_KEY`
   - `CARTESIA_API_KEY` or `ELEVENLABS_API_KEY`
4. **Configure Twilio:**
   - Buy US phone number ($1.15)
   - Enable India in Voice Geo Permissions
   - Set Voice webhook URL to `https://your-app.onrender.com/api/voice`
5. **Test end-to-end** — click "Call Me" on the web portal with your own Indian number

### 8.3 Local Development

For local development and testing:
- Use **ngrok** to expose your local server to the internet (Twilio needs a public URL for webhooks)
- Run `ngrok http 3000` → get a public URL like `https://abc123.ngrok-free.app`
- Set that URL as your Twilio webhook

---

## 9. Cost Analysis

### 9.1 Development & Testing Costs (One-Time)

| Service | Cost | Notes |
|:---|:---|:---|
| **Twilio US Number** | $1.15/month | One local US number |
| **Twilio Voice (outbound to India)** | ~$0.02/min | ~50 test calls × 3 min avg = $3.00 |
| **Twilio Voice (outbound to US)** | ~$0.01/min | Cheaper if Krunal uses a US number |
| **Deepgram** | $0 | $200 free credit on signup |
| **Gemini 2.0 Flash** | $0 | 1,500 free requests/day |
| **Cartesia Sonic** | $0 | 100K characters/month free |
| **ElevenLabs** | $0–$1 | 10K chars free, $1 for starter plan |
| **Render.com** | $0 | Free tier for web services |
| **Domain (optional)** | $0 | Use Render's free subdomain |
| **TOTAL** | **~$5–$10** | For full development + testing |

### 9.2 Production Costs (If Scaled)

For context (to discuss with Krunal), here's what running this at HelloCounsel's scale would look like:

| Volume | Monthly Cost | Per-Call Cost |
|:---|:---|:---|
| 1,000 calls/month (10 firms, 100 calls each) | ~$250 | ~$0.25/call |
| 10,000 calls/month (100 firms) | ~$2,000 | ~$0.20/call |
| 100,000 calls/month (1,000 firms) | ~$15,000 | ~$0.15/call |

Compare this to **Smith.ai** (hybrid AI + human) which charges **$95–$825/month per firm** — HelloCounsel's pure-AI model has massive margin advantage.

---

## 10. Risk Analysis & Mitigations

| Risk | Severity | Mitigation |
|:---|:---|:---|
| **Twilio free trial limitations** | Medium | Upgrade account ($20 deposit). Trial accounts can only call verified numbers. |
| **High latency on India calls** | Low | Acceptable for demo (~700ms TTFA). Production would use local SIP trunking. |
| **LLM hallucination during intake** | High | Guardrails layer + structured prompts + Zod validation. Code-over-prompt for critical logic. |
| **Deepgram STT accuracy on Indian accents** | Medium | Use Nova-2 model (best multilingual support). Acceptable for demo since Krunal speaks clear English. |
| **Render free tier cold starts** | Medium | First request after idle may take 30s. Pre-warm the server before sending the link to Krunal. |
| **WebSocket disconnection mid-call** | Medium | Implement reconnection logic and graceful degradation. Log all errors for debugging. |
| **Krunal tests edge cases that break the agent** | High | Implement comprehensive guardrails + fallback responses. The agent should never crash — it should gracefully say "I didn't catch that, could you repeat?" |

---

## 11. Success Criteria

### 11.1 Technical Success

- [ ] Web portal loads in under 2 seconds
- [ ] Call initiates within 5 seconds of clicking "Call Me"
- [ ] Agent greets the caller within 1 second of answering
- [ ] Agent responds to each utterance within 800ms (TTFA)
- [ ] Agent successfully conducts a full 7-phase intake interview
- [ ] Agent extracts structured data from the conversation (validated by Zod schema)
- [ ] Agent handles at least 2 interruptions gracefully without breaking flow
- [ ] Call summary is displayed on the web portal after call ends
- [ ] Mock CMS receives the structured intake data

### 11.2 Business Success

- [ ] Krunal is impressed enough to move forward with an offer or assignment
- [ ] Demo demonstrates understanding of the specific PI legal intake domain (not generic chatbot)
- [ ] Demo shows production engineering thinking (error handling, guardrails, adapter pattern, observability)
- [ ] Krunal sees that we built in 3 days what would take most engineers weeks

---

## 12. Timeline

### Day 1: Core Voice Pipeline (10–12 hours)

| Time Block | Task | Deliverable |
|:---|:---|:---|
| 0–2h | Project setup, dependencies, env config | Working Express server with Twilio SDK |
| 2–4h | Twilio telephony handler (outbound call + TwiML webhook) | Can trigger a call and hear silence |
| 4–6h | Twilio Media Streams WebSocket handler | Raw audio flowing bidirectionally |
| 6–8h | Deepgram STT integration (streaming) | Can see live transcripts in console |
| 8–10h | LLM integration (Gemini Flash, streaming) | Can see AI responses in console |
| 10–12h | TTS integration (Cartesia/ElevenLabs, streaming) | **End-to-end voice conversation working** |

**Day 1 Checkpoint:** You can call yourself and have a basic voice conversation with the AI.

### Day 2: Agent Intelligence & Web Portal (10–12 hours)

| Time Block | Task | Deliverable |
|:---|:---|:---|
| 0–2h | Intake FSM (state machine with 7 phases) | Agent follows structured intake flow |
| 2–4h | System prompts (phase-specific, with guardrails) | Agent asks the right questions per phase |
| 4–6h | Structured data extraction (Zod schemas) | JSON output after each call |
| 6–8h | Barge-in / interruption handling | Agent stops speaking when interrupted |
| 8–10h | Web portal frontend (dark theme, premium UI) | Click-to-call interface |
| 10–12h | Call status updates (SSE/polling) + call summary display | **Full web portal working** |

**Day 2 Checkpoint:** Web portal is live. You can enter your number, get called, complete a full intake, and see the summary.

### Day 3: Polish, CMS Mock & Deploy (8–10 hours)

| Time Block | Task | Deliverable |
|:---|:---|:---|
| 0–2h | Mock CMS adapter (Filevine mock) | Structured data written to mock CMS |
| 2–4h | Error handling, edge cases, silence detection | Agent handles errors gracefully |
| 4–6h | UI polish (animations, responsiveness, loading states) | Premium look and feel |
| 6–8h | Deploy to Render.com + Twilio production config | **Live public URL** |
| 8–10h | End-to-end testing with Indian numbers | **Ready to share with Krunal** |

**Day 3 Checkpoint:** You send Krunal the link. He opens it, enters his phone number, clicks "Call Me," and talks to the AI.

---

## Appendix: HelloCounsel Company Intel

### A.1 Market Context

| Metric | Value |
|:---|:---|
| Global Legal AI Market (2026) | $2.75B–$5.21B |
| CAGR | 11–34% |
| Average PPC cost per click (PI firms) | $200–$400 |
| Speed-to-lead impact | 100x higher conversion within 5 minutes |

### A.2 Competitive Landscape

| Competitor | Model | Pricing | Key Differentiator |
|:---|:---|:---|:---|
| **Smith.ai** | Hybrid (AI + 500 human agents) | $95–$825/month per firm | Market leader, 7,000+ integrations |
| **Answering Legal** | Human-only | Per-minute pricing | 100% legal-trained human staff |
| **Thoughtly** | AI-first | $500/month base | Lead conversion engine, voice/SMS/email |
| **LegalClerk.ai** | AI-first | Unknown | High-volume PI, strict qualification |
| **Eve Legal** | AI-first | Unknown | Plaintiff firms, Clio/MyCase integration |
| **CallCow** | AI-first | Unknown | AI voice agent for lawyers |
| **HelloCounsel** | AI-first | Custom pricing | Deep CMS integration (8+ platforms), both inbound AND outbound, Injury Board Ventures distribution |

### A.3 HelloCounsel's Competitive Moat

1. **Deep CMS integration** — they don't just answer calls; they write structured data into 8+ CMS platforms with per-tenant custom field mapping
2. **PI vertical focus** — not a generic voice AI; built specifically for personal injury legal workflows
3. **Investor distribution** — Injury Board Ventures = built-in customer pipeline of elite plaintiff trial attorneys
4. **India engineering, US revenue** — cost arbitrage (high-value USD clients, INR engineering costs)
5. **Both inbound AND outbound** — most competitors only do one

### A.4 Key Technical Insights for Conversation with Krunal

1. **Voice Pipeline Stack:** Likely using Twilio/Telnyx → Deepgram → GPT-4/Claude/Gemini → ElevenLabs/Cartesia. May be using Vapi (~$0.05/min orchestration) or Retell (~$0.08/min) as middleware, or building custom (most likely given they're hiring AI engineers).

2. **CMS Integration Complexity:** Filevine uses open API v2 with custom per-tenant schemas. SmartAdvocate uses SOAP-based `SAWebService.svc` endpoints. Each CMS has different auth (API keys, OAuth, session tokens), rate limits, and field naming conventions. This is the unsexy but critical engineering challenge.

3. **TCPA Compliance:** FCC ruled Feb 2024 that AI voices = "artificial or prerecorded" under TCPA. Violations cost $500–$1,500 per call. Every outbound call needs real-time consent verification against a consent database. This is a hard infrastructure problem.

4. **Long-Running State:** PI cases span months. The agent needs checkpoint-and-resume (like Temporal.io), tiered memory (short-term call context + long-term case history), and idempotent operations (retrying a CMS write must not create duplicates).

5. **Agent Evaluation:** Non-deterministic AI outputs require special testing approaches — golden datasets, LLM-as-a-Judge scoring, multi-trial evaluation (run same test 5x), and behavioral drift tracking on a spectrum rather than binary pass/fail.

---

*This PRD will be updated as implementation progresses. All code referenced above will be built by Antigravity AI, tested by Aditya, and deployed to a public URL for Krunal to experience firsthand.*
