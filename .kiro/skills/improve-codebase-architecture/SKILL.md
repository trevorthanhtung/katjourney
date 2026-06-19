---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable and AI-navigable.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Core Vocabulary

Use these terms exactly — don't drift into "component," "service," "API," or "boundary":

- **module** — a unit of code with an interface and implementation
- **interface** — the public surface of a module
- **depth** — ratio of implementation complexity to interface complexity (deep = good)
- **seam** — a boundary where one module hands off to another
- **adapter** — a module that translates between two seams
- **leverage** — one change in the interface produces many changes in behavior
- **locality** — related logic lives close together

## When to Apply

- User wants to refactor or improve the codebase structure
- Modules are shallow (interface nearly as complex as implementation)
- Related logic is scattered across many small files
- Code is hard to test through its current interface
- AI navigation requires bouncing between too many files to understand one concept

## Process

### 1. Explore for Friction

Walk the codebase and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where do tightly-coupled modules leak across their seams?
- Which parts are untested, or hard to test through their current interface?

Apply the **deletion test**: would deleting a module concentrate complexity, or just move it?
- "Yes, concentrates" → the module is shallow, a deepening opportunity
- "No, just moves" → the module has real depth, keep it

### 2. Identify Deepening Opportunities

For each candidate:

- **Files involved** — which files/modules are affected
- **Problem** — why the current structure causes friction
- **Solution** — what would change in plain English
- **Benefits** — improved locality, leverage, testability
- **Recommendation strength** — `Strong`, `Worth exploring`, or `Speculative`

### 3. Refactoring Principles

- Prefer fewer, deeper modules over many shallow ones
- Co-locate things that change together
- Hide implementation details behind stable interfaces
- The interface is the test surface — design it to be testable
- One adapter = hypothetical seam; two adapters = real seam worth naming
