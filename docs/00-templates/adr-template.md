# ADR-XXX: [Short Decision Title]

> **Status:** [Draft | Proposed | Accepted | Deprecated]
> **Date:** YYYY-MM-DD
> **Owner:** [Your name or team]
> **Last Updated:** YYYY-MM-DD
>
> **Template instructions:** Copy this file to `docs/01-architecture/decisions/ADR-XXX-short-slug.md`, replace `XXX` with the next number, and fill in each section. Delete the instructional bullet points at the end of each section.

---

## Status

[Accepted | Proposed | Deprecated]

---

## Context

What is the problem or situation that forced this decision?

- Describe the background in 2–5 sentences.
- Include the constraints that mattered (time, cost, team skill, existing code, deployment environment, etc.).
- State the forces at play (e.g., "the kanban board needed live updates" or "the team had no experience with WebSockets").

---

## Decision

What was decided?

State the decision in one or two sentences, clearly and unambiguously.

> Note: This section is written in the **present tense**, as if you are describing the current state. Example: "The application uses Inertia.js v2 as the SPA bridge between Laravel and React."

---

## Alternatives Considered

| Alternative | Why rejected |
|---|---|
| [Alternative 1 — e.g., "Separate REST API + React SPA"] | [Short reason — e.g., "doubled auth, validation, and serialization logic"] |
| [Alternative 2 — e.g., "Server-rendered Blade views"] | [Short reason — e.g., "poor interactivity for drag-and-drop kanban"] |
| [Alternative 3] | [Short reason] |

---

## Consequences

What changes as a result of this decision?

### Positive

- [Consequence 1 — e.g., "Single source of truth for validation on the server side"]
- [Consequence 2 — e.g., "No CORS or API versioning needed for the web client"]

### Negative / Costs

- [Consequence 1 — e.g., "Frontend is tightly coupled to server-shaped props"]
- [Consequence 2 — e.g., "Real-time still requires a separate Pusher broadcast channel"]

### Risks

- [Risk 1 — e.g., "Pusher dependency adds monthly cost at scale"]
- [Risk 2]

---

## Related ADRs / Documents

- [ADR-001: Use Inertia.js instead of a separate REST API](./ADR-001-inertia-spa.md)
- [Database Schema](../database-schema.md)
- [Architecture Overview](../overview.md)

---

## Notes / Follow-ups

- [ ] [Follow-up task, if any]
- [ ] [Follow-up task]