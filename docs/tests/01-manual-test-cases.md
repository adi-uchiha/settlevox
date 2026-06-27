# Human Manual Testing - SettleVox Use Cases

This document outlines 3 realistic use cases for manual end-to-end testing of the SettleVox AI Voice Agent. These scenarios are designed to validate the core voice pipeline (STT → LLM → TTS), the state machine (FSM), and edge case handling (barge-in/interruptions).

---

## Use Case 1: The "Golden Path" Qualified Auto Accident

**Objective:** Verify that the agent successfully navigates all 7 FSM phases, collects required data, and marks a clear-cut case as qualified.

### Caller Profile
- **Name:** John Davis
- **Incident:** Rear-ended at a red light in Austin, TX.
- **Injuries:** Whiplash and lower back pain.
- **Treatment:** Went to the ER, currently seeing a chiropractor.
- **Liability:** Other driver was ticketed.

### Testing Script / Flow
1. **[Greeting]** Agent answers and asks for permission to record. 
   - **Tester says:** "Yes, that's fine."
2. **[Incident]** Agent asks what happened.
   - **Tester says:** "I was rear-ended at a stoplight yesterday in Austin, Texas."
3. **[Injury]** Agent asks about injuries.
   - **Tester says:** "Yeah, my neck is killing me. I went to the ER and they diagnosed whiplash. I also have some lower back pain."
4. **[Liability]** Agent asks if another party was involved/at fault.
   - **Tester says:** "The other guy wasn't paying attention. The police came and gave him a ticket."
5. **[Insurance]** Agent asks about insurance.
   - **Tester says:** "I got his Geico insurance info, and I have State Farm."
6. **[Qualification]** Agent evaluates and asks for contact info.
   - **Tester says:** "My name is John Davis, my number is the one I'm calling from."
7. **[Wrap-Up]** Agent concludes the call.
   - **Tester says:** "Okay, thank you."

### Expected Outcome
- **FSM State:** Reaches `WRAP_UP`.
- **Dashboard Data:** `is_qualified: true`, all fields (incident, location, injury, treatment, fault, insurance) accurately populated.

---

## Use Case 2: The Unqualified / Low-Value Lead

**Objective:** Verify that the agent handles unqualified leads gracefully, without offering legal advice, and correctly logs the disqualification reason.

### Caller Profile
- **Name:** Sarah Jenkins
- **Incident:** Slipped on her own driveway and broke her wrist. 
- **Liability:** No other party involved. 

### Testing Script / Flow
1. **[Greeting]** Agent answers and asks for permission.
   - **Tester says:** "Sure."
2. **[Incident]** Agent asks what happened.
   - **Tester says:** "I was walking to my car this morning and slipped on some ice on my own driveway."
3. **[Injury]** Agent asks about injuries.
   - **Tester says:** "I broke my wrist and had to get a cast."
4. **[Liability]** Agent asks if another party was involved.
   - **Tester says:** "No, it's my house. I just slipped."
5. **[Qualification]** Agent recognizes lack of third-party liability (based on firm criteria).
   - **Tester says:** [Wait for agent response]

### Expected Outcome
- **Agent Behavior:** Agent should politely inform the caller that the firm may not be the best fit for this specific situation, as there is no third-party liability.
- **Dashboard Data:** `is_qualified: false`, with `qualification_reason` stating "No third-party liability / occurred on own property."
- **FSM State:** Should fast-track to `WRAP_UP`.

---

## Use Case 3: The Interruption & Out-of-Band Question (Barge-In)

**Objective:** Test the real-time latency, WebSocket buffer flushing, and LLM context management when the caller interrupts the agent or asks an off-script question.

### Caller Profile
- **Name:** Michael Chang
- **Behavior:** Impatient, asks questions outside the immediate FSM phase.

### Testing Script / Flow
1. **[Greeting]** Agent starts speaking: "Thank you for calling [Firm Name]..."
   - **Tester interrupts (Barge-in):** "Wait, is this a real person or a robot?"
   - *System should instantly stop speaking within ~250ms.*
2. **[Recovery]** Agent responds truthfully but steers back.
   - **Tester says:** "Okay, fine. Yes, you can record."
3. **[Incident]** Agent asks what happened.
   - **Tester says:** "I was in a crash, but hey, how much do you guys charge?" (Out-of-band question)
4. **[Handling]** Agent should explain the contingency fee model briefly (no upfront costs, percentage of settlement) and then re-prompt for the incident details.
   - **Tester says:** "Got it. So yeah, I was T-boned at an intersection in Chicago."
5. **[Injury & Beyond]** Continue with normal flow to verify the agent hasn't lost its place in the state machine.

### Expected Outcome
- **Barge-in Latency:** Audio playback stops almost immediately when the tester interrupts.
- **Context Retention:** Agent handles the out-of-band questions (fee structure, AI identity) without breaking character or losing the overarching goal (collecting intake data).
- **Dashboard Data:** Accurate transcript reflecting the interruptions, sentiment analysis might mark as "impatient" or "neutral."

---

## Use Case 4: The Over-Sharer (Testing FSM Fast-Forwarding)

**Objective:** Verify that the state machine correctly parses multiple pieces of data in a single turn and skips redundant FSM phases (fast-forwarding) instead of asking for information already provided.

### Caller Profile
- **Name:** David Miller
- **Behavior:** Speaks in long paragraphs, provides incident, injury, and liability info before being asked.

### Testing Script / Flow
1. **[Greeting]** Agent answers and asks for permission to record.
   - **Tester says:** "Yes, go ahead. Look, I was rear-ended on I-35 yesterday in Dallas. The other guy got a ticket, but my neck hurts really bad and I'm headed to the ER right now. Geico is his insurance."
2. **[FSM Fast-Forward]** The agent should recognize that Incident, Injury, Liability, and Insurance phases have been fulfilled.
   - **Agent behavior:** Should *not* ask "What happened?" or "Were you injured?". It should immediately acknowledge the situation, confirm any missing details (e.g., confirming if the tester has their own insurance), or jump straight to Qualification.
   - **Tester says:** "I have Progressive."
3. **[Qualification & Wrap-Up]** Agent asks for contact info.
   - **Tester says:** "David Miller, call me back at this number."

### Expected Outcome
- **FSM State:** Quickly advances from `Greeting` straight to `Qualification` / `WRAP_UP`.
- **Dashboard Data:** All fields populated correctly despite being extracted from a single turn.

---

## Use Case 5: Refusal of Contact Information (Testing Fallbacks)

**Objective:** Test the FSM refusal handlers and Zod schema fallbacks. Ensure the LLM correctly outputs "REFUSED" and the system does not crash or get stuck in an infinite loop asking for the same data.

### Caller Profile
- **Name:** Anonymous (Refuses to give name or email)
- **Incident:** Standard qualified auto accident.

### Testing Script / Flow
1. **[Greeting to Insurance]** Go through the standard flow to reach the Qualification phase.
   - **Tester says:** "Yes I was in an accident, other person at fault, I broke my leg, they had insurance."
2. **[Qualification]** Agent determines the lead is qualified and asks for full name and email to connect with an attorney.
   - **Tester says:** "I don't want to give my name or email right now. Just have a lawyer call this number."
3. **[Handling]** Agent should accept the refusal gracefully, rather than repeatedly demanding the email address.
   - **Tester says:** "No, just the number is fine."
4. **[Wrap-Up]** Agent concludes the call.

### Expected Outcome
- **FSM Loop Prevention:** Agent does not get stuck in an infinite loop asking for the email.
- **Dashboard Data:** `caller_email` and `caller_name` should be logged as `REFUSED` or `UNKNOWN` without causing a Zod schema validation crash. `is_qualified: true`.

---

## Use Case 6: Refusal of Recording / TCPA Compliance Check

**Objective:** Verify that the system respects caller consent and gracefully terminates the call if recording permission is denied during the Greeting phase.

### Caller Profile
- **Name:** Privacy Advocate

### Testing Script / Flow
1. **[Greeting]** Agent answers and says: "...This call may be recorded for quality purposes. Is that okay?"
   - **Tester says:** "No, I do not consent to being recorded."
2. **[Termination]** Agent must acknowledge the refusal, state it cannot continue, and ask if the user has any other questions.
   - **Agent behavior:** "I understand. Unfortunately, we cannot proceed with the automated intake without recording consent. Do you have any other questions for me today?"
   - **Tester says:** "No, that's it."
3. **[Wrap-up]** Agent says goodbye and ends call.
   - **Agent behavior:** "Okay, goodbye!"

### Expected Outcome
- **FSM State:** Immediately jumps to an `End` or `Terminal` state.
- **Dashboard Data:** Call logged as `INCOMPLETE` or `ERROR` with reason `consent_refused`. Extracted data remains empty.
