---
name: explore-code
description: Focused codebase search with minimal context usage
---

# /explore-code — Targeted Codebase Search

Search the codebase for specific patterns, files, or architecture questions without loading unnecessary context.

## Usage

`/explore-code <what to find or understand>`

## Approach

Spawn an **Explore** agent with a tightly scoped prompt. The agent uses Glob, Grep, and targeted Read (specific line ranges, not whole files) to answer the question.

## Examples

- `/explore-code where are server actions defined and what pattern do they follow`
- `/explore-code how does the renewal engine determine which loans to renew`
- `/explore-code which components use the Badge primitive and with what variants`

## Guidelines

- Always specify search breadth in the agent prompt: "quick" for a single lookup, "medium" for moderate exploration, "thorough" for cross-file analysis.
- The agent should report file paths, line numbers, and brief code context — not dump entire files.
- For questions about live Finna HTML structure, this is the wrong tool. Use the scraping discipline from CLAUDE.md instead (fetch live page first).
