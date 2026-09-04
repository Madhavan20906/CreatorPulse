---
name: CreatorPulse demo mode
description: Why the hackathon MVP keeps the growth loop reliable without requiring external provider credentials.
---

CreatorPulse's demo path must remain fully runnable without platform OAuth credentials. Gemini generation is enabled through the user-owned `GEMINI_API_KEY`, while deterministic scoring, collision detection, QA, and measurement remain the stable contract; provider failure must fall back explicitly rather than silently fabricate AI output.

**Why:** Built-in AI provisioning required an account upgrade, so the user supplied a Gemini key instead. The hackathon path still needs to work if the provider is slow, unavailable, or omitted.

**How to apply:** Keep Gemini generation optional, label provider-backed output in activity, and preserve deterministic scoring, demo data, and simulated publishing honestly in the UI and submission docs.