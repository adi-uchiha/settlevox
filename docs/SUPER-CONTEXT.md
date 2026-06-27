# ⚡ SettleVox System Architecture & Super Context

This document acts as the definitive **Super Context** for the SettleVox repository. It outlines the full-stack architecture of the AI voice agent, the backend orchestration, and frontend standards. Any engineer or AI agent working on this codebase must adhere strictly to these rules.

---

## 🏛️ 1. Core Architectural Ideology
SettleVox is a demo clone of HelloCounsel — an AI voice agent for personal injury law firm intake. It consists of two decoupled but integrated layers:
1.  **Backend (Express/Node.js + WebSockets):** A highly concurrent event-driven backend handling real-time audio streams between Twilio, Deepgram (STT), Gemini (LLM), and Cartesia (TTS).
2.  **Frontend (React + Vite):** A modern, dark-themed Single Page Application (SPA) utilizing Tailwind CSS v3 and shadcn-ui components. It acts as both the "Click-to-Call" trigger portal and the authless read-only Analytics Dashboard.

### High-Performance Targets:
- **Time-to-First-Audio (TTFA):** Target sub-600ms latency for voice interactions.
- **Barge-in (Interruption) Latency:** Agent must halt speech within 250ms of user interruption.
- **Frontend Responsiveness:** Dashboard loads instantly, polling data gracefully without layout shifts.

---

## ⚙️ 2. The Tech Stack & Version Pinning
To ensure stability and predictable builds, SettleVox relies on specific, proven versions of core libraries. **Do NOT upgrade these to the "latest" bleed-edge versions unless explicitly approved.**

### Backend Stack:
- **Node.js:** Backend orchestration layer.
- **Express:** REST API & Webhook routing.
- **ws:** Raw WebSocket handling for Twilio Media Streams.
- **@google/genai:** Gemini 2.5 Flash for the LLM brain (streaming mode).
- **@cartesia/cartesia-js:** Ultra-low latency Text-to-Speech (WebSocket streaming).
- **Cartesia STT (Ink-Whisper):** Raw WebSocket connection for Speech-to-Text (Replacing Deepgram to unify engine ecosystem).
- **Zod:** Runtime schema validation for LLM outputs (structured data extraction).
- **Pino:** High-performance structured logging.

### Frontend Stack:
- **Vite + React (TypeScript)**
- **Tailwind CSS v3:** Explicitly v3.4.x to maintain compatibility with legacy UI components. Do not use Tailwind v4.
- **shadcn-ui (v0.8.x):** Using the older `shadcn-ui` CLI package, NOT the new `shadcn` v2 package which forces React 19/Tailwind v4.
- **Recharts / Chart.js:** For dashboard analytics.
- **Phosphor Icons:** Use `@phosphor-icons/react` explicitly. **NEVER** import deprecated, non-suffixed Phosphor icons (e.g. `GraduationCap`). **ALWAYS** use the direct standard suffixed versions (e.g. `GraduationCapIcon`).

---

## 🎙️ 3. The Voice Pipeline & Orchestration
The voice pipeline is a delicate loop that requires extreme care regarding async state and buffer management.

### The Pipeline Loop:
`Twilio (Raw Audio) ➔ Cartesia STT ➔ Orchestrator ➔ Gemini LLM ➔ Cartesia TTS ➔ Twilio (Raw Audio)`

### Critical Voice Engineering Rules:
1. **Never block the event loop:** Audio processing and WebSocket chunking must remain fully asynchronous.
2. **Buffer Management:** Wait for logical sentence boundaries (`.`, `?`, `!`) from the LLM before sending text chunks to Cartesia. Sending partial words destroys the TTS prosody.
3. **Barge-In (Interruption):** When Cartesia STT emits an interim transcript indicating the user spoke, the Orchestrator MUST:
   - Send a `clear` command to Twilio to stop playing current audio.
   - Flush the local TTS audio queue.
   - Cancel the active LLM generation stream.
4. **Encoding Matching:** Twilio natively sends/receives 8kHz G.711 μ-law audio. Cartesia STT and TTS must be configured to consume/produce 8kHz μ-law audio directly. **Do not transcode audio to PCM/WAV in Node.js**; it wastes CPU and adds latency.

---

## 🧠 4. Agent Intelligence & FSM
The Agent doesn't just chat; it executes a strict **Finite State Machine (FSM)** for Legal Intake.

- **Phase State:** The agent moves through 7 strict phases: Greeting ➔ Incident ➔ Injury ➔ Liability ➔ Insurance ➔ Qualification ➔ Wrap-up.
- **Dynamic Prompts:** The system prompt is re-generated on every turn, injecting the current FSM phase instructions and the previously extracted data context.
- **Structured Extraction:** After every user turn, if the phase is complete, the LLM must output a structured JSON object conforming to a Zod schema to save state to the CRM mock.
- **No Legal Advice:** Guardrails are absolute. The agent cannot guarantee settlements, offer legal opinions, or validate claims.

---

## 💅 5. Frontend Aesthetics & Design Rules
- **Theme:** Dark mode by default. Deep rich blacks (`#0f0f0f`), dark gray surfaces (`#1a1a1a`), and warm HelloCounsel-style gold accents (`#c9a84c`).
- **Typography:** Inter or a similar clean, professional sans-serif.
- **Components:** Rely on shadcn-ui for complex components (Tables, Dialogs, Selects). Customize the `globals.css` theme variables to match the dark gold aesthetic.
- **Dashboard Data:** The dashboard is **authless** and **read-only**. It polls the backend `/api/calls` and `/api/stats` to render charts and tables.

---

## 🛡️ 6. Code Quality & Formatting
- **TypeScript Everywhere:** Strict typing for both frontend and backend. No `any` unless interacting with unknown raw third-party payloads.
- **Simplicity First:** Write the minimum code necessary to solve the problem. Do not over-abstract.
- **Clean orphans:** If your changes create unused imports or variables, remove them immediately.

---

## 📈 7. 2026 API Modernizations & SDK Knowledge Update
Based on a recent extensive audit (June 2026), the following modern SDK implementations and critical optimizations have been codified into the repository:

### Voice & Transcription Engines
- **STT Unification (Deepgram -> Cartesia):** Deepgram was completely removed. The architecture now unifies STT and TTS under Cartesia to simplify WebSocket logic and reduce latency bottlenecks.
- **Cartesia STT (Ink-Whisper):** 
  - Cartesia has deprecated `Ink-Whisper` in favor of `Ink 2` for standard use, but the legacy Websocket (`wss://api.cartesia.ai/stt/turns/websocket`) is maintained for backward compatibility. 
  - **CRITICAL (Header Bug Fix):** Always pass the modern `cartesia_version` header or query string (e.g., `2026-06-26`) to avoid deprecation errors and access backend optimizations.
- **TTS Integration (Cartesia Sonic):**
  - Sends base64 `audio/x-mulaw` bytes at 8000Hz (perfect for Twilio).
  - Must append a custom `context_id` and explicitly pass `continue: true` on sentence chunks, followed by `continue: false` on the final chunk.
  - **TTS Cancellation (Ghosting Bug Fix):** The Cartesia WebSocket `{"cancel": true}` payload **strictly requires** the active `context_id`. If `context_id` is missing, Cartesia ignores the cancel command, finishes generating the old sentence in the background (wasting credits), and ghost-streams it to Twilio, causing the agent to speak over itself.
  - **Greedy TTS Buffering (Latency Bug Fix):** Originally, the TTS buffer parsed sentences via an `if` statement. If the LLM streamed multiple sentences in a single fast chunk, the buffer locked up. It must use a greedy recursive `while` loop (e.g., `while(match)`) to parse and chunk sentences instantly.
### LLM Orchestration
- **Gemini (`@google/genai`):** 
  - **Unified SDK:** We correctly use the unified SDK. 
  - **Structured Data:** The `responseSchema` configuration now natively accepts Zod schemas (`z.ZodSchema`) ensuring perfectly typed extraction without needing raw JSON translation.
  - **Direct User Text (Logic Bug Fix):** Fixed a critical context bug where the caller's raw text was missing from the Gemini `history` array. Always push `{ role: 'user', parts: [{ text: userText }] }` per turn.
  - **Context Optimization & Caching:** Instead of stuffing the entire `conversationHistory` into the system prompt (which bloats tokens and latency), the architecture pushes individual transcripts into the `this.history` object native to Gemini. This leaves the massive System Prompt as a static "shared prefix." Gemini 2.5 Flash natively utilizes **Implicit Context Caching** on this prefix across all conversational turns automatically, providing a massive cost savings and slashing Time-to-First-Token latency.
  - **Hardware Constraints:** Always hard-cap `maxOutputTokens: 300` in the Gemini streaming config. LLMs can hallucinate and ignore "1-2 sentences" instructions. This hard limit physically prevents the model from generating long monologues, protecting Cartesia TTS credits and conversational pacing.

### Infrastructure & Telephony
- **Twilio Media Streams:**
  - **Zero-Delay Call Initiation:** When routing a call, never use `twiml.say()` before `<Connect><Stream>`. It forces the caller to listen to a slow, robotic Twilio TTS before the AI can answer, destroying realism. Always route directly to the stream.
  - **Native Storage (Free):** To record calls, explicitly set `record: true` when initiating the outbound call via the Twilio SDK. Twilio will natively host the audio on their servers and POST the `RecordingUrl` back to our webhook (`/api/call-status`) upon call completion. Save this URL directly to Postgres.
  - **Zero-Copy Audio Passthrough (CPU Optimization):** Cartesia emits raw `base64` audio over the WebSocket. Twilio requires `base64` audio for its Media Stream. Do NOT decode the Cartesia string to a Node.js `Buffer` just to re-encode it. Pipe the `base64` string directly from Cartesia to Twilio to eliminate Node.js CPU overhead.
  - Standard payloads are still 8kHz, Base64 encoded $\mu$-law (`audio/x-mulaw`). **Never attach WAV headers** to outbound audio or it creates static noise.
  - **Barge-in / Silence Lock (Clear Event):** Sending a `{"event": "clear"}` instantly stops audio, but this must be guarded by an `isAgentSpeaking` flag to prevent spamming Twilio during ambient user noise.
- **Database Architecture (Drizzle ORM + Neon Postgres):**
  - The application strictly uses **Drizzle ORM** mapping to a **Neon Postgres** database. All highly-nested JSON data (extracted info, transcripts) is stored efficiently within native `jsonb` columns.
  - **Concurrent Extraction Queue (Data Corruption Fix):** If users speak rapidly, multiple `final_transcript` events trigger concurrently. The Orchestrator locks extraction with `isProcessingExtraction` and an `extractionPending` flag queue to guarantee Gemini extraction queries never overlap and corrupt the FSM state.
  - **Database Latency Protection:** The backend does *not* write to the database on every single chunk of transcribed audio. To protect DB throughput and prevent connection pooling lock-ups, the Orchestrator tracks the full transcript purely in RAM (`this.transcriptData`) and flushes it via a single batch `UPDATE` transaction during the `destroy()` lifecycle event.
- **Express Webhook Processing:**
  - **express.urlencoded Middleware (Webhook Bug Fix):** Twilio natively fires webhooks (like `/api/call-status`) as `application/x-www-form-urlencoded`. The Express app MUST mount `app.use(express.urlencoded({ extended: true }))` alongside `express.json()`. Without this, Twilio payloads are dropped, `req.body` is blank, and Native Call Recordings fail to save.
- **Node.js WebSockets:** To avoid V8 garbage collection memory leaks on dropped calls, `ws.removeAllListeners()` and `orchestrator.destroy()` must both be explicitly called on the WebSocket's `close` and `error` events.

### Frontend & Agent Logic Paradigms
- **FSM Fast-Forwarding:** In `intake-fsm.ts`, `checkTransition` must use a recursive `while` loop, not a single `if` statement. If a caller provides multiple answers at once, the FSM must skip intermediate phases instantly rather than redundantly asking for data it already extracted.
- **FSM Refusal Handlers (Infinite Loop Fix):** If an FSM phase strictly requires a field (e.g., email) and the caller refuses to provide it, the LLM extraction will leave it undefined by default, trapping the FSM in an infinite loop. The LLM extraction prompt must explicitly instruct the bot to output `"REFUSED"` or `"UNKNOWN"` for rejected fields to properly advance the state machine.
- **Zod Schema Refusal Fallbacks:** Because the LLM outputs `"REFUSED"`, strict Zod schema fields (like `z.boolean()` or `z.string().email()`) will crash and drop the data. You must wrap strict fields in a union: `z.union([z.boolean(), z.enum(['REFUSED', 'UNKNOWN'])])` and remove strict `.email()` checks so the FSM logic doesn't fatally crash.
- **LLM Prosody Protection:** LLMs naturally use ellipses (`...`) for filler words. Low-latency sentence regexes (like `/[.?!]\s/`) will split exactly on the first dot, breaking "Um..." into chunks and completely destroying Cartesia's voice prosody. The LLM System Prompt must explicitly prohibit ellipses and dashes.
- **Silence Prompt Tracking:** If the agent triggers a silence prompt (e.g. "Are you still there?"), it **must** set `isAgentSpeaking = true` and send a `mark` event to Twilio, allowing the universal `handleMark` function to securely reset the silence timer only after the prompt finishes.
- **React Polling (Latency/Memory):** Never use `setInterval` inside `async` polling functions (`CallDetails.tsx`, `DashboardOverview.tsx`). A slow backend will cause intervals to stack, triggering massive concurrent API requests and UI crashes. Always use a tracked, recursive `window.setTimeout()` inside the promise resolution.
