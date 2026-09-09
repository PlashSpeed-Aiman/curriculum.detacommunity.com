# ADR 0001: Web and API foundations module

- Status: Accepted
- Date: 2026-09-10

## Context

The Backend development course had an empty Web and API foundations module. Later modules cover
ASP.NET Core and REST API design, so the first module needs to establish HTTP literacy without
coupling the learner to a framework or prematurely teaching endpoint design.

## Decision

The module will use three required lessons in this order:

1. Follow one request: the anatomy of an HTTP exchange
2. Status codes as a contract
3. JSON on the wire: content types and serialization

The lessons will:

- Stay framework-agnostic and use observable HTTP exchanges, `curl`, and browser-console exercises.
- Teach request lifecycle and framing before response semantics, then content negotiation and JSON
  serialization.
- Keep REST design in module 03 and ASP.NET-specific implementation in module 02.
- Store lesson prose in `src/content/*.md`, with metadata in `src/data/curriculum.ts`.
- Register Markdown manually through `?raw` imports in `src/views/LessonView.vue`.
- Use the existing generic lesson route rather than adding module-specific routes.
- Begin authored Markdown at `##`; the Vue lesson view owns the page `h1`.
- Cite the relevant RFC sections for protocol and serialization claims.

The module summary is therefore `HTTP, JSON, status codes, and how a request moves.`

## Consequences

Learners can inspect an HTTP exchange before framework abstractions are introduced, and the following
modules can build on shared terminology for status codes, media types, retries, and serialization.
The content remains portable across backend stacks, but each new lesson requires an explicit Markdown
file, metadata record, raw import, and route verification.

## Verification

- `npm run build` passes.
- The three direct lesson routes return HTTP 200 through the Vite development server.
- `git diff --check` passes.
