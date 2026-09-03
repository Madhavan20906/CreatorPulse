# CreatorPulse architecture

CreatorPulse is organized around one closed growth loop rather than a set of disconnected generators.

```mermaid
flowchart TB
  subgraph EXPERIENCE[Creator experience]
    LANDING[Landing + onboarding]
    PULSE[Pulse dashboard]
    LIBRARY[Channel intelligence]
    OPPORTUNITY[Opportunity map]
    FACTORY[Content factory]
    GATE[Quality gate]
    CALENDAR[Calendar]
    ANALYTICS[Analytics]
    MEMORY[Creator memory]
  end

  subgraph SERVICES[Application services]
    ROUTES[Express REST API]
    SCORE[Explainable scoring]
    COLLISION[Collision detector]
    GENERATE[Package generator]
    VALIDATE[Deterministic validators]
    LEARNING[Prediction vs actual]
  end

  subgraph DATA[Persistence]
    STATE[(creator_state JSONB)]
    HISTORY[Channel history]
  end

  LANDING --> PULSE
  PULSE --> ROUTES
  LIBRARY --> ROUTES
  OPPORTUNITY --> ROUTES
  FACTORY --> ROUTES
  GATE --> ROUTES
  CALENDAR --> ROUTES
  ANALYTICS --> ROUTES
  MEMORY --> ROUTES

  ROUTES --> SCORE
  ROUTES --> COLLISION
  ROUTES --> GENERATE
  ROUTES --> VALIDATE
  ROUTES --> LEARNING
  SCORE --> HISTORY
  COLLISION --> HISTORY
  GENERATE --> STATE
  VALIDATE --> STATE
  LEARNING --> STATE
  STATE --> SCORE
  STATE --> PULSE
  STATE --> MEMORY
```

## Design rules

1. Deterministic calculations own numeric scores and baseline comparisons.
2. Reasoning outputs carry their source signals so creators can challenge them.
3. Creator approval is required before the demo scheduler marks content as scheduled.
4. Demo data is labeled at the source instead of being presented as private analytics.
5. Measured performance updates Creator Memory and changes future opportunity ranking.