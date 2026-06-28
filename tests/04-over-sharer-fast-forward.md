# Use Case 4: The Over-Sharer (Testing FSM Fast-Forwarding)

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
