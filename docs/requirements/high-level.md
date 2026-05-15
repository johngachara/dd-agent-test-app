---
milestones:
  - id: M1
    name: Core Authentication
    status: in-progress
  - id: M2
    name: User Profile Management
    status: planned
epics:
  - id: AUTH
    milestone: M1
    name: Authentication
  - id: PROF
    milestone: M2
    name: Profile Management
---

# High-Level Requirements

## M1 — Core Authentication

Covers user login, session lifecycle, and logout. The goal is secure, user-friendly access with clear error feedback and automatic session expiry handling.

## M2 — User Profile Management

Covers reading and updating a user's profile, including name, bio, email, and avatar. Email changes require password confirmation for security.
