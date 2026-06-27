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


