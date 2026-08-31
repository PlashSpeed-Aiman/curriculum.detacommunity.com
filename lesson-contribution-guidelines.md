# Lesson Contribution Guidelines

This guide explains how users and agents can add authored lessons to Curriculum. Lesson metadata
lives in `src/data/curriculum.ts`; lesson prose lives in `src/content/*.md` and is rendered by the
lesson view.

## Before You Start

1. Read [`AGENTS.md`](AGENTS.md) and [`style-guide.md`](style-guide.md).
2. Find the course and module where the lesson belongs.
3. Check the existing lessons for terminology, scope, and difficulty.
4. Decide whether the lesson is ready to publish or should remain a planned outline.

Keep a planned lesson unavailable until its Markdown content, metadata, and route are connected.
Do not create a fake `contentFile` or an empty Markdown file just to make an outline look complete.

## How Lessons Work

The current lesson pipeline has four parts:

1. A `CurriculumLesson` record describes the lesson in `src/data/curriculum.ts`.
2. A Markdown file in `src/content/` contains the authored lesson body.
3. `src/views/LessonView.vue` imports the Markdown file with Vite's `?raw` suffix.
4. The view passes the imported text to `marked` and renders the resulting HTML.

The import step is currently manual. Adding a file to `src/content/` by itself does not make it
available to the application.

## Add A Published Lesson

### 1. Choose A Filename

Use a short, unique, lowercase kebab-case filename in `src/content/`:

```text
src/content/android-compose-state.md
```

Use the filename only in `contentFile`. Do not put a source path in the lesson record.

Good filenames describe the lesson topic rather than its position:

```text
android-compose-state.md
docker-image-layers.md
api-request-lifecycle.md
```

Avoid spaces, uppercase letters, dates, temporary names, and generic names such as `lesson1.md`.

### 2. Write The Markdown Body

Create the file in `src/content/`. The Vue view owns the page title and the only `h1`, so begin the
Markdown body at `h2`:

````markdown
## What this lesson covers

Explain the outcome and why it matters in a production application.

## Build the first slice

Introduce one idea at a time.

```kotlin
fun loadProfile() {
    // Keep the example small enough to run and inspect.
}
```

## Practice

Give the learner a concrete change to make and a way to check it.
````

Use normal Markdown headings, paragraphs, lists, links, blockquotes, and fenced code blocks. Add a
language identifier to every code fence when one exists, such as `kotlin`, `dart`, `ts`, `bash`, or
`json`.

Do not add a Markdown `#` heading, front matter, or a duplicate page title. The current renderer
does not parse front matter as metadata; it would be displayed as lesson content.

### 3. Add Lesson Metadata

Add a `CurriculumLesson` object to the appropriate module in `src/data/curriculum.ts`:

```ts
{
  id: 'android-compose-state',
  slug: 'compose-state',
  title: 'State in Jetpack Compose',
  summary: 'Model screen state clearly and keep recomposition predictable.',
  contentFile: 'android-compose-state.md',
}
```

Follow these rules:

- Make `id` stable and unique within the curriculum.
- Make `slug` lowercase kebab-case and unique within its module.
- Keep `title` short enough for the lesson header and navigation.
- Describe the learner outcome in `summary`; do not repeat the full lesson.
- Make `contentFile` match the Markdown filename exactly, including its extension.
- Keep long-form prose out of `curriculum.ts`.

The lesson order is the order of the `lessons` array. Place the record where the learner should
encounter it, rather than sorting by filename.

### 4. Register The Markdown Import

Add a raw import and map it in `src/views/LessonView.vue`:

```ts
import androidComposeStateMarkdown from '../content/android-compose-state.md?raw'

const markdownByFile: Record<string, string> = {
  'docker-basics.md': dockerBasicsMarkdown,
  'android-compose-state.md': androidComposeStateMarkdown,
}
```

The map key must be the same value used by `contentFile`. Use a descriptive import name and keep
the import near the other content imports.

### 5. Verify The Route

For a regular course module, the lesson route is:

```text
/curriculum/<course-slug>/<module-slug>/<lesson-slug>
```

For example:

```text
/curriculum/docker/basics/setup
```

The existing generic routes do not require a new router entry for a regular module. A new route is
needed only when the lesson belongs to a new kind of content, such as a track-specific module.

## Lesson Structure

A useful lesson normally contains these parts, in an order appropriate to the topic:

1. **Outcome:** What the learner will be able to understand or build.
2. **Context:** Why the concept matters and where it fits in the larger path.
3. **Explanation:** The smallest set of concepts needed for the task.
4. **Example:** A focused, runnable example with its important decisions explained.
5. **Practice:** A concrete change, experiment, or debugging task.
6. **Check:** A short way to confirm that the learner reached the outcome.
7. **Next step:** What the learner should study or build next.

The lesson should have one primary outcome. Split a lesson when it starts teaching unrelated
concepts or becomes too large to complete in one sitting.

## Writing For Production

- Explain the behavior a learner will observe, not only the API they will call.
- Show loading, empty, error, retry, and offline behavior when the feature has those states.
- State assumptions such as language, framework, operating-system, SDK, or tool versions.
- Prefer small complete examples over large excerpts with missing setup.
- Explain trade-offs and boundaries, especially around state, persistence, networking, security, and
  background work.
- Include accessibility, testing, observability, and failure handling when they are relevant to the
  feature.
- Use descriptive link text and link to primary documentation where possible.
- Keep the voice clear, direct, and respectful of a busy learner.
- Avoid claims such as "master everything" or "production-ready" unless the lesson defines what that
  means and demonstrates it.

For Android and Flutter tracks, make the relationship between the paths explicit when useful. A
lesson can point out which ideas transfer from the companion track and which parts are platform
specific. Do not make a learner repeat shared foundations without a reason.

## Content And Security Rules

Local Markdown is currently treated as authored, trusted content. `LessonView.vue` renders it with
`v-html`. Therefore:

- Never put user-submitted or remote Markdown into this pipeline without adding sanitization.
- Do not include `<script>` elements, event-handler attributes, or unsafe embedded HTML.
- Never commit API keys, passwords, access tokens, private certificates, or personal data.
- Use fake values in examples and explain where a real secret should be supplied.
- Avoid commands that delete data, change system-wide configuration, or expose credentials unless the
  lesson clearly warns about the effect and provides a safe alternative.
- Prefer reproducible commands and explain the directory and environment they expect.

## Guidance For Agents

Agents adding a lesson should:

1. Inspect the target course, module, neighboring lessons, route, and relevant style guidance.
2. Keep the change focused on the lesson and the wiring it requires.
3. Use the existing curriculum types and Markdown rendering path.
4. Avoid adding dependencies when platform APIs or the current stack are sufficient.
5. Preserve placeholder states; do not turn a planned outline into an active lesson without authored
   content.
6. Check every filename, ID, slug, import, and route for consistency.
7. Run the build and report any limitation that could not be verified.

Agents should not invent API responses, framework behavior, benchmark results, or external links.
When a version-specific detail matters, verify it from the relevant primary documentation before
writing it.

## Current Limitations

The current prototype has a few deliberate limitations:

- Every Markdown file must be imported manually in `LessonView.vue`.
- Lesson read time, category metadata, and footer counts are currently hardcoded in the view.
- The Android and Flutter `plannedModules` lists are outline-only strings, not active module routes.
- There is no test or lint command yet; `npm run build` is the required automated check.

If a contribution needs accurate read time, categories, automatic content discovery, or
track-specific lesson routes, make that a separate implementation change instead of hiding the
limitation in lesson prose.

## Contribution Checklist

Before opening a change, confirm:

- [ ] The lesson has one clear learner outcome.
- [ ] The Markdown file is in `src/content/` with a unique kebab-case filename.
- [ ] The Markdown body begins with `##`, not `#`.
- [ ] The metadata record has a stable `id`, a unique `slug`, a useful `summary`, and the exact
      `contentFile` filename.
- [ ] The raw Markdown import and `markdownByFile` entry are present.
- [ ] Code fences have language identifiers and examples do not contain secrets.
- [ ] Links are descriptive and relevant.
- [ ] The direct lesson URL loads after a refresh.
- [ ] The back-to-module link works.
- [ ] Keyboard focus, readable contrast, and mobile reading width remain intact.
- [ ] `npm run build` passes.
