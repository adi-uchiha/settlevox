# Use Case 6: Refusal of Recording / TCPA Compliance Check

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
