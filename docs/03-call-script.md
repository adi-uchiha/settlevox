# Call Script & Conversation Playbook

**Call with:** Krunal Chauhan (CTO, HelloCounsel)
**Time:** 8:00 PM IST, June 24, 2026
**Duration:** Expect 30–45 minutes
**Nature:** Informal/exploratory — he booked via your Cal.com link after a cold email, NOT through a formal recruiting pipeline

---

## ⚡ The Meta-Strategy

This is NOT a technical interview. This is a **founder evaluating whether he wants to work with you.**

Krunal is going to assess:
1. **Do you understand what we're building?** (domain awareness)
2. **Can you actually ship?** (production engineering credibility)
3. **Will you fit on a 4-person team?** (culture/vibe)
4. **Are you worth the salary?** (ROI)

Your goal:
1. **Show you understand voice AI for legal** (not generic AI hype)
2. **Demonstrate you've built production AI systems** (your email already did this — now back it up)
3. **Ask questions that show depth** (make HIM want to tell you more)
4. **Leave him thinking "this guy gets it"**

---

## 🎬 Opening Script (First 2–3 minutes)

### When the call starts:

> *"Hey Krunal, thanks for booking so quickly — I wasn't expecting a reply in 12 minutes."*

*(This is a casual compliment that also shows you noticed his decisiveness. It breaks the ice.)*

### If he asks "Tell me about yourself":

> *"Sure. I'm Aditya — I've been CTO at BabyCloud for the past 8 months. 100K+ users, 8-person team. I joined as a developer, got promoted to CTO in 3 months, and built the engineering team from scratch. The most relevant thing I've built for what you're doing is a fault-tolerant LLM translation pipeline — I rotated API keys across 23 GCP projects, built a custom JSON-repair lexer for truncated responses, and localized 50K+ items at zero API cost. That pipeline had to be reliable, observable, and cheap — which I imagine is exactly what voice AI agents for law firms need to be."*

**Key:** Keep it under 60 seconds. Don't list every project. Hit the one thing that maps closest to HelloCounsel.

### If he says "I read your email, tell me more about X":

Follow his lead. He's telling you what interested him. Go deep on whatever he asks about.

---

## 🎯 Your Talking Points (Use as Needed)

### 1. "Why HelloCounsel specifically?"

> *"Honestly, the problem space is what drew me in. You're not building a chatbot — you're building AI systems that need to listen to live calls, extract structured legal intake data from messy conversations, and write it reliably into CMS platforms that all have different schemas. That's a distributed systems + AI orchestration + integration engineering problem. It maps directly to what I've been doing at BabyCloud, just in a different domain."*

### 2. "What do you know about what we do?"

> *"From what I can see — you build AI voice agents for PI law firms. Counsel handles inbound calls for 24/7 intake and lead qualification, and outbound calls for administrative follow-ups like medical records and insurance claims. The real engineering challenge is the CMS integration layer — you're writing into Filevine, SmartAdvocate, Litify, CASEpeer, and others, each with different API schemas. And you need all of this to be reliable enough that a law firm trusts it to talk to their injured clients."*

*(This shows you've done your homework. Krunal will notice.)*

### 3. "What relevant experience do you have?"

**Hit these in order of relevance to HelloCounsel:**

**a) LLM Pipeline (most relevant):**
> *"I built a translation pipeline that processes 50K+ items through Gemini. The hard parts were: rotating API keys across 23 GCP projects to stay in free tier (345 RPM effective throughput), DST-aware quota resets anchored to California midnight, and a custom JSON-repair lexer for truncated responses. LLMs truncate output past the context window — I built a character-by-character parser with a bracket stack to close incomplete payloads. That's the same class of problem you hit with voice AI: the LLM output is never perfectly structured."*

**b) Agentic State Machine (second most relevant):**
> *"Kairos is my AI system design tool — it uses a 4-phase agentic state machine. Discovery, MCQ-based ambiguity resolution, diagram generation, then refinement. The key insight was separating logical structure from spatial layout — LLMs generate great relationship graphs but terrible coordinates. I used Dagre for layout and Drizzle ORM for atomic service swaps. There's a bi-directional sync loop that resolves conflicts between AI mutations and manual edits."*

**c) Production Infrastructure (supporting):**
> *"At BabyCloud I migrated 6 microservices to a modular TypeScript monolith — 40% cloud cost reduction, zero downtime for 100K+ users. Built ACID-compliant financial ledgers, 3-tier security infrastructure blocking 2K+ attacks daily, 99.9% uptime."*

### 4. "We primarily use Python"

> *"My production LLM pipeline was in Node.js/TypeScript, but I'm comfortable with Python. I've used it for ML projects and I pick up languages fast — when I joined BabyCloud, I went from developer to CTO in 3 months. The system design thinking and AI pipeline engineering are language-agnostic. I can ramp up on your Python codebase quickly."*

### 5. "Why are you leaving BabyCloud?"

> *"I built everything that needed building — financial ledgers, security infrastructure, the LLM pipeline, modular monolith migration. The hard infrastructure problems are solved. The roadmap now is mostly content operations and feature iteration. I want to work on systems where the core product IS the engineering challenge — voice AI agents that need to be reliable, observable, and scalable in real-world workflows."*

---

## ❓ Questions to Ask Krunal (Critical)

### Understanding the Problem (Shows depth)
1. *"What's your current voice pipeline stack? Are you using Vapi/Retell/Bland, or did you build custom?"*
2. *"What's the biggest reliability challenge right now — latency, hallucination, CMS write failures, or something else?"*
3. *"How do you handle interruption detection? Are you using standard VAD or something more sophisticated?"*
4. *"When you say 'long-running agents that maintain state' in the job description — what does a case lifecycle look like for your AI? Is it managing state across multiple calls over weeks?"*

### Understanding the Engineering Culture
5. *"How does eval/regression testing work for your agents? With non-deterministic outputs, how do you know an update didn't break something?"*
6. *"How do you split work between you, Priyansh, and the new hire? Are there clear ownership boundaries or is it more fluid?"*
7. *"What does a typical day look like for the engineering team?"*

### Understanding the Business
8. *"How many law firms are you live with right now?"*
9. *"What's the biggest bottleneck to growth — is it engineering velocity, sales, or something else?"*
10. *"What does success look like for this hire in the first 90 days?"*

### The Closer (Ask Only If the Vibe is Good)
11. *"What's the compensation range you're thinking about for this role?"*
12. *"Is there an equity component given the stage?"*

---

## 🚫 What NOT to Do

1. **Don't monologue.** This is a conversation, not a presentation. If you talk for more than 90 seconds without pausing, you've lost him.
2. **Don't oversell.** He's a CRED founding team member. He can smell bullshit. Be honest about what you know and don't know.
3. **Don't badmouth BabyCloud.** "The problems are solved" is fine. "The company is boring" or "my team sucks" is not.
4. **Don't ask about WFH.** The job posting says 6 days WFO. If this is a dealbreaker, address it after you have an offer, not on the first call.
5. **Don't lie about Python experience.** If you're not strong in Python, say "I'm a fast learner, here's proof" — not "I'm an expert."
6. **Don't bring up salary first.** Let him bring it up. If the conversation ends without discussing it, ask casually at the very end.
7. **Don't mention your Edgematics offer aggressively.** Save it for negotiation. If he asks directly, say *"I have an offer at 18 LPA but I'm evaluating based on the engineering challenge and team, not just comp."*

---

## 🎯 Call Closing Script

### If it goes well:

> *"This has been great, Krunal. The technical challenges here — making voice agents reliable for high-stakes legal workflows, the multi-CMS integration problem, the eval infrastructure — are exactly the kind of problems I want to solve. What's the next step from here?"*

### If he asks about timeline:

> *"I can start relatively quickly. I have a standing offer but I'm prioritizing the right fit. If there's alignment here, I'm happy to move fast."*

### If he asks about compensation expectations:

> *"I'm looking for something in the 25–30 range, plus meaningful equity given the stage. I understand it's a seed company and I'm fine with a compensation structure that reflects that — I'm betting on the upside."*

---

## 📊 Quick Reference Card (Keep This Open During the Call)

| Their Pain | Your Proof |
|:---|:---|
| LLM output is unreliable | JSON-repair lexer for truncated responses |
| Multi-CMS integration is messy | Built multi-tool integrations, deep-linking, financial ledgers |
| Agents need to run long-term | 4-phase agentic state machine in Kairos |
| Need production reliability | 99.9% uptime, 3-tier security, zero-downtime migration |
| Need to scale fast (4-person team) | CTO who built and managed 8-person team across 16 repos |
| Voice AI is real-time | Built real-time WebSocket dashboards (Kokan) |
| Python-first codebase | Fast learner — developer to CTO in 3 months |
