# Use Case 1: The "Golden Path" Qualified Auto Accident

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
