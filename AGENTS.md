<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

## Sensitive files

The following files must never be accessed or inspected by the agent:

- `.env.local`

Rules:
- Do not read these files.
- Do not inspect their contents.
- Do not modify them.
- Do not copy, print, summarize, or expose their contents.
- Do not include their values in code, logs, patches, commits, or responses.
- If information from these files is required, ask the user to provide only the specific non-sensitive value needed.

<!-- END:nextjs-agent-rules -->
