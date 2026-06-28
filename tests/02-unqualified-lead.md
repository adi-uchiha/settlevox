# Use Case 2: The Unqualified / Low-Value Lead

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
