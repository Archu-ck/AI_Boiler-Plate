# Hackathon AI Monorepo

> **Goal:** A collection of self-contained AI-powered features, each running as its own Next.js 15 application in a Turborepo-managed monorepo structure.

---

## 🛑 Source of Truth & Instructions
* **IMPORTANT:** Read `agent.md` at the start of every session. It is your ultimate source of truth.
* Update the "Current Progress" section every time we complete a feature.
* Update the "Next Up" section only when instructed by the USER.

---

## 🛠️ Architecture Rules

1. **Strict Isolation:** Nothing is shared between features. Each feature lives in its own folder under `features/` with its own Next.js application, `package.json`, ports, dependencies, and API routes.
2. **Server-Side AI Only:** ALL Anthropic SDK (`@anthropic-ai/sdk`) calls **MUST** live in server-side `/api/` route handlers only. They must *never* be imported or called in client-side components.
3. **Port Isolation:** Each feature runs independently on its own assigned port in development mode.
4. **Technology Stack:**
   - **Next.js 15** (App Router, TypeScript, Strict Mode)
   - **Tailwind CSS v4** + **shadcn/ui**
   - **Turborepo** + **npm workspaces** at the root level

---

## 📍 Planned Features & Port Allocations

Each feature runs independently on its assigned port:

| Feature | Port | Directory | Status |
| :--- | :--- | :--- | :--- |
| **Feature 1: ai-chat** | `3001` | `features/ai-chat` | 🟢 Completed |
| **Feature 2: TBD** | `3002` | `features/feature-2` | 🔴 Not Started |
| **Feature 3: TBD** | `3003` | `features/feature-3` | 🔴 Not Started |
| **Feature 4: TBD** | `3004` | `features/feature-4` | 🔴 Not Started |
| **Feature 5: TBD** | `3005` | `features/feature-5` | 🔴 Not Started |
| **Feature 6: TBD** | `3006` | `features/feature-6` | 🔴 Not Started |
| **Feature 7: TBD** | `3007` | `features/feature-7` | 🔴 Not Started |
| **Feature 8: TBD** | `3008` | `features/feature-8` | 🔴 Not Started |

---

## 📈 Current Progress

- [x] Monorepo root scaffolded:
  - `package.json` with npm workspaces (`features/*`)
  - `turbo.json` with Turborepo task pipeline
  - `.gitignore` configured
  - `.env.example` with `ANTHROPIC_API_KEY` placeholder
  - `features/` directory created (with `.gitkeep` placeholder)
  - `agent.md` created in the root directory
- [x] Feature 1: `ai-chat` completed on port `3001`

---

## 🎯 Next Up

* [ ] Wait for user instruction to build the first feature and assign its port.
