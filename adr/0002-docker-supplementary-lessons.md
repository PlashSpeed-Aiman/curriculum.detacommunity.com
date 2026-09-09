# ADR 0002: Docker supplementary lessons (logs, secrets, and the beginner's answer)

- Status: Accepted
- Date: 2026-09-10

## Context

The Docker course had authored required lessons but uneven supplementary material: Docker basics had
one optional lesson (MySQL with DBeaver), Dockerfiles had a layers deep-dive and an instructions
reference, and Docker Compose had none. A field incident write-up existed in
`plans/software-war-story-mongodb-disk.md`, and learners needed an approachable answer to "what is
Docker?" alongside a security lesson on Dockerfile secrets. All three gaps map to the same product
pattern: optional material rendered below the required lesson sequence with an explicit
"supplementary" label.

## Decision

Add one supplementary lesson to each of three Docker modules:

1. `docker/compose/log-rotation-war-story` - War story: the 11 GB container log that filled the
   disk. Teaches default `json-file` logging behavior, per-service log rotation with the `logging`
   attribute, container recreation to apply it, and multi-file `-f` merging. Authored from the field
   report in `plans/software-war-story-mongodb-disk.md`.
2. `docker/dockerfiles/secrets-env-arg` - How to host a buffet for your attackers: secrets, ENV, and
   ARG in Dockerfiles. Demonstrates how `ENV` and `ARG` expose secrets through image configuration,
   `docker image history`, and layer extraction, then shows `RUN --mount=type=secret` as the
   build-time fix and multi-stage builds as a distribution boundary with stated limits.
3. `docker/basics/what-is-docker` - If your friend asks what is Docker? Tell them this. A beginner
   summary of what Docker is, the problem it solves, images/containers/registries, and the Linux
   namespaces and cgroups underneath, ending in one explainable phrase.

The lessons follow the existing content contract:

- Metadata lives in `src/data/curriculum.ts` under each module's `supplementaryLessons`; prose lives
  in `src/content/*.md` and begins at `##` (the Vue lesson view owns the page `h1`).
- Each new file is registered manually through a `?raw` import and a `markdownByFile` entry in
  `src/views/LessonView.vue`. A `contentFile` string alone does not load content; the import map is
  the actual loader and is the first thing to check when a lesson body renders empty.
- Technical claims are fact-checked against primary sources before writing: official Docker and
  MongoDB documentation, Linux man pages for kernel behavior, and local reproduction where the
  claim is operational (leak outputs, log rotation, secret mounts). Incident numbers are framed as
  incident reports, not universal claims.
- Lessons that do not teach Compose do not reference Compose; cross-module vocabulary stays within
  the module that introduced it.
- The existing generic lesson route is reused; no module-specific routes were added.

## Consequences

The three Docker modules now each offer optional study material that deepens or explains the
required sequence without hiding incomplete content. Lessons carry a "Primary references" section
listing the sources that back their claims, which keeps the fact-checking discipline auditable.

The manual `LessonView.vue` import map grows with every lesson and remains a silent failure point:
`npm run build` does not verify that a `contentFile` is registered, so an unregistered file builds
cleanly but renders an empty lesson body. Automatic registration through
`import.meta.glob('../content/*.md', { query: '?raw', import: 'default' })` was considered and left
as a follow-up rather than a change to this ADR. Until then, every new lesson must add its import
and map entry, and the bundle grep check in Verification is the regression guard.

## Verification

- `npm run build` passes (module count rose from 51 to 54 as the three Markdown files were added).
- The body of each lesson is present in the production bundle: `rg` finds lesson markers in
  `dist/assets/*.js`.
- The three direct routes return the authored lesson: `/curriculum/docker/basics/what-is-docker`,
  `/curriculum/docker/dockerfiles/secrets-env-arg`, and
  `/curriculum/docker/compose/log-rotation-war-story`.
- Key technical behaviors were reproduced locally before publication: `ENV`/`ARG` values visible in
  `docker image inspect` and `docker image history`; secret files surviving deletion inside earlier
  image layers; multi-stage final images free of builder-stage secrets; secret mounts failing with
  `required` when absent and leaving no trace when present; `json-file` rotation taking effect only
  after a container recreate.
- `git diff --check` passes.
