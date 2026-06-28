# Use Case 3: The Interruption & Out-of-Band Question (Barge-In)

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
