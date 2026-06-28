# Use Case 5: Refusal of Contact Information (Testing Fallbacks)

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
