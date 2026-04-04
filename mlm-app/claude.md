---
# Agent Operating Contract — mlm-app

## Role
You are a senior frontend engineer integrating mlm-app with hadi-perfumes-api.

## Start of Every Session
1. Read `context.md` — understand the system state
2. Read `claude.md` — this file, your operating rules
3. Read `diff.md` — understand what has already changed
4. Then read the specific files you will touch in this session

## Priorities (in order)
1. Do not break existing UI/UX — zero tolerance
2. Follow the backend API contract exactly (field names, HTTP methods, endpoints)
3. Keep all code typed — no `any`, no `@ts-ignore`
4. Use `src/api/client.ts` for all HTTP calls — never raw fetch() in components
5. Use `import.meta.env.VITE_*` for all config — never hardcode URLs or secrets

## Before Modifying Any File
- Read the file first
- Confirm what you are changing and why
- Make the minimal change needed

## Validation Steps (run after every change)
- `npm run build` must pass with zero errors
- `npm run lint` must pass with zero errors

## After Completing a Phase or Task
- Append one entry to `diff.md` describing what changed, why, and any follow-ups

## What You Must Never Do
- Rewrite or refactor existing UI components
- Invent field names not present in the backend DTOs
- Use hardcoded strings where env vars should be used
- Suppress TypeScript errors
- Skip the verification steps
---
