# Curriculum Project Guide

## Purpose

This repository is the starting point for a curriculum website. The product should help a learner discover a learning path, understand what to study next, and track progress through lessons. Keep the first release focused on a clear learner experience rather than trying to build a complete learning-management system.

## Handoff Rule

Before changing the product, read this file and [`style-guide.md`](style-guide.md). Then inspect the relevant view, route, data, and Markdown files. Preserve the user flow and visual language described here unless the task explicitly changes them.

## Current Project

- Stack: Vue 3 with `<script setup>`, TypeScript, and Vite.
- Entry point: `src/main.ts` mounts `src/App.vue`.
- Current UI: a sample landing page in `src/views/HomeView.vue` and a subject directory in `src/views/CurriculumView.vue`.
- Global styles: `src/style.css`, the current editorial visual system.
- Visual guidance: see [`style-guide.md`](style-guide.md) before changing colors, typography, layout, or interaction patterns.
- Static files: `public/`; imported images and SVGs live in `src/assets/`.
- Routing: `src/router/index.ts` provides `/`, `/curriculum`, subject, module, track, and lesson routes.
- Typed sample curriculum data: `src/data/curriculum.ts`, including Docker modules, mobile development tracks, and Backend development modules.
- Authored lesson content: `src/content/*.md`, rendered with `marked` in the lesson view.
- Current content status: Docker has authored lessons in its basics and Dockerfiles modules; Mobile app development has Android and Flutter placeholders; Backend development has placeholder modules.
- No application state library, backend, API client, test runner, or linter is configured yet.
- The package name is `curiculum`; use “Curriculum” in user-facing copy unless the product name is intentionally changed.

## Commands

```bash
npm run dev       # Start the Vite development server
npm run build     # Type-check and create a production build
npm run preview   # Serve the production build locally
```

There is no test or lint command yet. Add those tools only when the project needs them, and add their commands to `package.json` at the same time.

## Working Rules

- Use Vue single-file components with `<script setup lang="ts">`.
- Keep component data and props explicitly typed. Respect the strict TypeScript settings, especially `noUnusedLocals` and `noUnusedParameters`.
- Keep UI components focused. Put reusable curriculum data types in `src/types/`, static seed data in `src/data/`, and cross-component behavior in `src/composables/` when those directories are introduced.
- Separate content from presentation. Do not put a large course catalog directly in a template.
- Keep long-form lesson content in `src/content/*.md`. Use `contentFile` in the lesson data to connect a lesson to its Markdown file.
- Treat local Markdown files as authored, trusted content. If lesson content later comes from users, a CMS, or an API, sanitize the rendered HTML before using `v-html`.
- Prefer native HTML elements and semantic landmarks before adding abstractions.
- Every interactive control needs a keyboard path, a visible focus state, and an accessible name. Images need meaningful alt text, or an empty alt value when decorative.
- Design for narrow screens first and verify the layout at mobile, tablet, and desktop widths.
- Follow [`style-guide.md`](style-guide.md) for the visual language. Reuse its CSS tokens and established component patterns instead of adding arbitrary colors or one-off treatments.
- Use local state for a single view. Introduce a store only when state is shared across routes or needs persistence beyond one component.
- Do not add a dependency for a small helper that can be expressed clearly with platform or Vue APIs.
- Remove the Vite demo component, assets, and styles as they are replaced; do not leave starter UI connected to the real product.
- Use clear, consistent terminology: course, learning path, module, lesson, activity, learner, and progress. Record any intentional domain change here.
- In product copy, call a top-level curriculum entry a **course**. The current data type is named `CurriculumSubject` for historical reasons; do not expose “subject” in new user-facing copy unless it refers to a topic inside a course.

## Suggested Initial Structure

```text
src/
  assets/
  content/
  data/
  router/
  views/
  components/
  composables/
  types/
  App.vue
  main.ts
  style.css
```

The site currently uses `vue-router` for `/`, `/curriculum`, `/curriculum/:subjectSlug`, `/curriculum/:subjectSlug/:moduleSlug`, `/curriculum/:subjectSlug/track/:trackSlug`, and `/curriculum/:subjectSlug/:moduleSlug/:lessonSlug`. Add routes only when they represent a meaningful shareable screen.

## User Flow Contract

| Route | Purpose | Primary next action |
| --- | --- | --- |
| `/` | Explain the product and invite discovery | Open the curriculum |
| `/curriculum` | List courses and reveal available modules or tracks | Expand a course or open its overview |
| `/curriculum/:subjectSlug` | Show one course and its ordered modules or alternative tracks | Open a module or preview a track |
| `/curriculum/:subjectSlug/:moduleSlug` | Show a module and its lessons | Read an available lesson |
| `/curriculum/:subjectSlug/track/:trackSlug` | Show a track placeholder or future track content | Return to the course |
| `/curriculum/:subjectSlug/:moduleSlug/:lessonSlug` | Read one authored lesson | Return to the module or continue |

Flow rules:

- Use `RouterLink` for navigation and real `button` elements for disclosure or state changes.
- The chevron on `/curriculum` only expands or collapses the course details. It must not be the only way to reach a course, module, or track.
- Module and track entries inside an expanded course are direct links to their own routes.
- Preserve browser back/forward behavior and make every meaningful screen directly addressable.
- Keep the course overview, module page, and lesson page visually related through the patterns in [`style-guide.md`](style-guide.md).

## State Contract

- A module with lessons offers an active lesson link. A module with `lessons: []` opens its module page and shows a clear “Coming next” placeholder instead of invented content.
- A module may include optional `supplementaryLessons`; render them below the required sequence with an explicit label and keep them fully routable when authored.
- A track with `status: 'placeholder'` opens its track route and shows “Coming soon” copy. Do not make an unavailable track look complete.
- A missing course, module, track, or lesson shows a useful not-found state with a route back to the curriculum.
- An authored lesson requires a `contentFile` that resolves to a file in `src/content/`. Keep its page title in the Vue view and begin the Markdown body at `h2`.
- Do not add progress, authentication, or remote content assumptions until the product explicitly needs them.

## Component Inventory

- `src/views/HomeView.vue`: public landing page and visual introduction.
- `src/views/CurriculumView.vue`: course directory, expandable course details, and module/track links.
- `src/views/SubjectView.vue`: one course overview. Keep the existing filename until a deliberate type/file rename is planned.
- `src/views/ModuleView.vue`: ordered lesson list, supplementary lesson section, and empty-module state.
- `src/views/TrackView.vue`: alternative-track placeholder or future track overview.
- `src/views/LessonView.vue`: lesson header, Markdown rendering, breadcrumbs, and lesson navigation.
- `src/data/curriculum.ts`: typed course, module, track, and lesson metadata. Keep authored prose out of this file.
- `src/content/*.md`: editable lesson prose, examples, lists, and code blocks.
- `src/router/index.ts`: route names and URL structure. Prefer named routes in templates.
- `src/style.css`: global visual tokens and page patterns. Consult [`style-guide.md`](style-guide.md) before adding new styles.

There is not yet a shared layout or component library. Reuse the existing classes and markup patterns first; introduce a shared component only when at least two screens genuinely need the same behavior.

## Product Direction

Treat the first milestone as a public, usable curriculum browser:

1. Landing page that explains who the curriculum is for and presents a strong “Explore curriculum” action.
2. Curriculum directory with learning paths, level, estimated duration, topics, and search/filter controls.
3. Learning-path detail page with outcomes, prerequisites, ordered modules, and lesson status.
4. Lesson view with readable Markdown content, examples, links/resources, and previous/next navigation.
5. Lightweight progress tracking, initially in browser storage if accounts are not required.
6. Empty, loading, and error states for every future data-driven screen.

Model the content before building cards. A useful first-pass model should cover:

- `LearningPath`: stable id, slug, title, summary, description, level, topics, outcomes, prerequisites, estimated hours, and module ids.
- `Module`: stable id, title, summary, order, and lesson ids.
- `Track`: stable id, slug, title, summary, and placeholder or availability status when a learning path has alternatives.
- `Lesson`: stable id, slug, title, summary, order, `contentFile`, resources, and optional activity or assessment metadata.
- `Progress`: learner identifier or local-storage key, completed lesson ids, and last-opened lesson.

Keep seed content in typed data files so it can later be replaced by a CMS or API without rewriting page components.

## Definition Of Done

For a new course, module, track, or lesson flow:

1. The data record, route, and visible navigation are connected.
2. Available, placeholder, empty, and missing-content states are intentional and readable.
3. The relevant flow works through clicks, keyboard navigation, browser back/forward, refresh, and direct URL entry.
4. Authored lesson copy lives in Markdown, not in a Vue template.
5. The layout is checked at mobile and desktop widths and follows [`style-guide.md`](style-guide.md).
6. `npm run build` passes.

## UX and Content Requirements

- Make the next action obvious on every screen: browse, start, continue, or complete.
- Show learning outcomes and time commitment before asking a learner to start.
- Preserve reading width and hierarchy for lesson content; do not optimize lesson pages for dense card grids.
- Use real sample curriculum content early. Placeholder copy hides navigation and information-architecture problems.
- Include progress indicators that communicate both completed work and what remains.
- Support direct links and browser back/forward navigation once routes exist.
- Provide visible feedback for search, filtering, completion, and persistence failures.
- Keep the current light editorial theme as the default. Add dark mode only after the core theme and contrast are complete, and document the alternate tokens in [`style-guide.md`](style-guide.md).

## Verification

Before considering a change complete:

1. Run `npm run build`.
2. Exercise the changed flow in the browser, including refresh and direct URL entry for any route.
3. Check keyboard navigation, focus visibility, readable contrast, and meaningful page titles.
4. Check mobile and desktop layouts and confirm that images do not distort or overflow.
5. If data or persistence behavior changes, add focused tests once a test runner is configured.

Keep this file updated when the stack, commands, domain vocabulary, or product scope changes.
