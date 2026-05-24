---
name: feature
description: Multi-phase feature implementation with agent orchestration
---

# /feature — Agentic Feature Workflow

Orchestrate a full feature implementation through phased agent work. Each phase uses a focused subagent to minimize context and token usage.

## Usage

`/feature <description of what to build>`

## Phases

### Phase 1: Explore

Spawn an **Explore** agent (read-only, fast) to locate relevant files, understand current patterns, and map the codebase area. The agent reports back:
- Which files are involved
- Current patterns and conventions in those files
- Any constraints or gotchas

Keep the explore prompt focused: tell the agent exactly what area to search and what question to answer.

### Phase 2: Plan

Using the explore results, spawn a **Plan** agent to design the implementation:
- List files to create/modify with specific changes
- Identify risks or trade-offs
- Define verification criteria

Review the plan yourself before proceeding. Reject if it contradicts CLAUDE.md conventions.

### Phase 3: Implement

Implement the plan directly (no subagent needed — you have the plan and the context). Follow these rules:
- Work in small, verifiable steps
- Follow existing code patterns from Phase 1
- No dead code, no premature abstractions
- After implementation, run `/verify` to build-check

### Phase 4: Review

Read through all changed files. Check for:
- Type errors or missing imports
- Broken patterns (compared to Phase 1 findings)
- Missing error handling
- Accessibility issues (aria labels, semantic HTML)
- Design system violations (use tokens from globals.css, primitives from components/ui/)

Fix any issues found.

### Phase 5: Ship

Run `/ship` to build, commit, and push.

## Guidelines

- Each agent gets a **self-contained prompt** — include file paths, conventions, and enough context to work cold.
- Don't pass raw agent output to the next phase — synthesize it yourself, extract only what matters.
- If any phase fails, stop and report rather than guessing.
- For small changes (< 3 files), skip the agent phases and implement directly.
