# Plan: Android and Flutter track restructure — core vs. maintenance lane

Status: **draft outline, pre-authoring**. Nothing here is wired into the app. No `contentFile`
exists yet for any lesson below — per `lesson-contribution-guidelines.md`, a planned lesson stays
unavailable until its Markdown, metadata, and route are actually connected. The `plannedModules`
arrays in `src/data/curriculum.ts` still hold the old outlines; this file supersedes them only once
a separate implementation pass rewrites those arrays (see Open questions, below). Treat this file as
the reading/writing target, not as something to copy into `curriculum.ts` yet.

## Where this fits

Target: `curriculumSubjects` → `mobile-app-development` (`src/data/curriculum.ts:229`) → `tracks` →
`android` (lines 236–413) and `flutter` (lines 414–570). Both are `CurriculumTrack` records with
`status: 'placeholder'` and a `plannedModules?: CurriculumTrackModule[]` outline; neither has real
`modules`. `mobileSharedFoundations` (lines 55–59) and each track's `focusAreas` were reviewed
against the findings below and still read correctly — only `plannedModules` needs the recut this
plan describes.

## Premise

The user asked to review the tracks with an eye toward letting learners skip "old Android," and
didn't know where the line sits after being away from the platform for a while. Checking the current
outlines against primary sources (verified September 2026) turned up three problems, not just a
missing feature:

1. **Legacy sits first and on the critical path.** Android's planned modules 02–05 (XML views,
   Fragments/Nav2, legacy async, legacy migrations) are four consecutive legacy modules before
   Compose appears at module 06. Flutter's legacy module is 02. A green-field learner with no
   interest in old code currently has to read through all of it before reaching current material.
2. **The core/legacy line was drawn by era, not by relevance.** Topics filed under "classical
   Android" include several that are permanently core and unaffected by the move to Compose — the
   Activity lifecycle, configuration changes, process death and `savedInstanceState`, the `res/`
   resource and qualifier system, `AndroidManifest.xml`, intents, and permissions. Meanwhile
   Flutter's legacy module opens with material that cannot run on a current SDK at all, and files
   `FutureBuilder`/`StreamBuilder` — current, everyday API — as legacy.
3. **There is no mechanism for optionality on a track.** `CurriculumTrackModule`
   (`src/data/curriculum.ts:36-42`) is `id, number, title, summary, lessons: string[]` and nothing
   else — no field to mark a module as skippable. The only structured optionality anywhere in the
   codebase is `CurriculumModule.supplementaryLessons?` (line 18), which is lesson-scoped and exists
   only on real, authored modules, not on track outlines.

Both outlines also predate real platform movement: Google's May 2026 "Compose-first" policy put a
long list of View-based libraries into maintenance mode; Android 16/17 removed edge-to-edge and
large-screen orientation opt-outs; Navigation 3 shipped stable; and Flutter's August 2026 3.47
release split Material/Cupertino into standalone packages with the in-SDK versions scheduled for
deprecation in November 2026. None of that is in the current outlines.

This plan recuts both tracks into a **core lane** (current, required) and a **maintenance lane**
(for learners who will touch an existing codebase), placed after the core sequence rather than
interleaved — `style-guide.md:144` already forbids interleaving optional items between required
ones, so a trailing second sequence is the only placement consistent with existing product rules.

## Findings from the review

**The Compose-first policy, precisely.** Google declared Android UI development Compose-first in
May 2026. As of that policy: Fragment, RecyclerView, ViewPager/ViewPager2, Navigation (2),
ConstraintLayout, CoordinatorLayout, CardView, and roughly 18 other View-based Jetpack libraries are
in **maintenance mode** — they receive critical bug fixes only, no new features. The Layout Editor
and Navigation Editor in Android Studio are likewise in maintenance mode and will not gain new
features. Nothing in this list is deprecated or scheduled for removal; interop APIs (`ComposeView`,
`AndroidView`) remain fully supported; there is no migration mandate for existing apps. But every new
Jetpack library, every new Studio UI tool, and all new documentation and samples are Compose-only
going forward. This is the cleanest available line between "core" and "maintenance" for the Android
track, and it is more precise than "classical vs. modern," which is what the current outline uses.

**Rescue as core, currently misfiled as legacy (Android).** App components and the single-Activity
model, the Activity lifecycle, configuration changes, process death and `savedInstanceState`, the
`res/` resource system and qualifiers, `AndroidManifest.xml`, intents, permissions, the Activity
Result API, and the main-thread model are all untouched by the View→Compose shift. They belong in
core, early, regardless of UI toolkit.

**Missing from the Android core entirely.** Navigation 3 (stable; the 1.1 release adds Scene
Decorators for wrapping screens with bars, rails, and dialogs) has no module. Edge-to-edge has no
module, and it is no longer optional: apps targeting Android 16 lose the
`windowOptOutEdgeToEdgeEnforcement` opt-out. Adaptive layouts need to be taught as a platform
requirement, not a nicety: Android 17 ignores `screenOrientation` and `resizeableActivity`
restrictions entirely on displays ≥600dp. The targetSdk ratchet as an ongoing release-ops discipline
is missing — Google Play has required targeting API 36 since August 2026, and will require API 37
from August 2027. Kotlin 2.x/K2, Gradle Kotlin DSL, and version catalogs aren't mentioned. And there
is no module bridging to Kotlin Multiplatform / Compose Multiplatform, which is the honest technical
link to the companion Flutter track and worth naming explicitly given `companionSlug`.

**Rescue as core, currently misfiled as legacy (Flutter).** `FutureBuilder` and `StreamBuilder` are
current, idiomatic API for consuming async data in the widget tree — they should not sit in a legacy
module next to code that cannot run at all.

**Archaeology, not migration (Flutter).** Pre-null-safety Dart 2, Android embedding v1, and
`RaisedButton`/`FlatButton` cannot run against a current Flutter SDK — sound null safety has been
mandatory since Dart 3, and embedding v1 support is gone from the engine. This isn't a "migrate from"
lesson, it's dead code a learner will never encounter live. It gets one sentence each in a short
"not covered" note, not lesson slots.

**Missing from the Flutter core entirely.** Flutter 3.47 (August 2026) shipped standalone
`material_ui` and `cupertino_ui` 1.0 packages, decoupling the design systems from the core SDK; the
original in-SDK Material and Cupertino libraries are scheduled for formal deprecation in the November
2026 stable release. This migration will land in every Flutter codebase within months and belongs in
the **core** UI module, not the maintenance lane — it's imminent, not historical.

**Framing.** Label the second lane for *existing codebases*, not "optional extras." Most Android
(and a fair share of Flutter) work in the field is maintaining an app that already exists, not
greenfield work. The lane is sequenced last so it doesn't block a new learner, not because it matters
less.

## Draft module sequence — Android core lane (required)

Ordered as the required path. Each should end up with one primary outcome per
`lesson-contribution-guidelines.md`.

1. **`android-foundations`** — Android Studio, SDK, emulators, project structure, Gradle Kotlin DSL
   and version catalogs, Kotlin 2.x essentials, a coroutines primer, debugging with Logcat and the
   debugger.
   Outcome: create, run, and debug a minimal Android project with a current toolchain.
   Research: `developer.android.com` "Get started" and Kotlin 2.x release notes; verify current
   Android Studio / AGP / Kotlin version compatibility rather than assuming last-known versions.

2. **`android-platform-contract`** — app components and the single-Activity model, the Activity
   lifecycle, configuration changes, process death and `savedInstanceState`, the `res/` resource
   system and qualifiers, `AndroidManifest.xml`, intents, permissions, the Activity Result API.
   Outcome: explain why the OS can destroy and recreate an Activity at any time, and preserve state
   correctly across that boundary.
   Research: `developer.android.com/guide/components/activities` and the app-manifest/permissions
   guides — this content is stable but should be checked against the current guide structure.

3. **`android-compose-fundamentals`** — composition and recomposition, state hoisting, `remember` /
   `rememberSaveable`, side-effect APIs, layout and modifiers.
   Outcome: build a Compose screen with correctly hoisted state that survives recomposition and
   configuration change.
   Research: `developer.android.com/develop/ui/compose/documentation`, "Thinking in Compose."

4. **`android-material-design`** — Material 3 theming, dynamic color, typography, components,
   accessibility.
   Outcome: theme a Compose screen with Material 3 and verify it meets basic accessibility contrast
   and touch-target rules.
   Research: `developer.android.com/develop/ui/compose/designsystems/material3`.

5. **`android-adaptive-ui`** — window size classes, adaptive and multi-pane layouts, foldables,
   edge-to-edge, predictive back.
   Outcome: make a screen adapt correctly across phone, tablet, and foldable widths, with edge-to-edge
   enabled correctly.
   Research: the Android 16 behavior-changes doc and the "orientation and resizability changes"
   blog post — confirm current behavior directly rather than from memory, since this changed across
   Android 16 and 17.

6. **`android-navigation3`** — back stack ownership, scenes and Scene Decorators, type-safe routes,
   deep links, adaptive multi-pane navigation.
   Outcome: wire multi-screen navigation with Navigation 3, including a list-detail adaptive layout.
   Research: `developer.android.com/guide/navigation/navigation-3` and the `navigation3` release
   notes — Navigation 3 is new enough that the API surface should be checked against the current
   release, not assumed stable across versions.

7. **`android-architecture-state`** — MVVM and unidirectional data flow, ViewModel + StateFlow, the
   loading/error/empty/success contract, feature boundaries.
   Outcome: structure a feature with a ViewModel exposing StateFlow and a Compose UI that renders
   every state of that contract.
   Research: `developer.android.com/topic/architecture` guide-to-app-architecture.

8. **`android-networking`** — Retrofit/OkHttp or Ktor, kotlinx.serialization, repositories and DTO
   mapping, auth and token refresh, pagination, retries, cancellation.
   Outcome: call a real API through a repository layer with correct error handling and cancellation.
   Research: current Retrofit/Ktor docs; confirm which is presented as primary, since this has
   shifted in community and Google sample guidance.

9. **`android-local-data`** — Room, DataStore, local source of truth, sync and conflicts.
   Outcome: persist and sync data locally with Room and DataStore as the source of truth for the UI.
   Research: `developer.android.com/training/data-storage/room`,
   `developer.android.com/topic/libraries/architecture/datastore`.

10. **`android-di-background-work`** — Hilt, WorkManager, foreground service types, connectivity-aware
    sync, notifications and the runtime notification permission.
    Outcome: schedule reliable background sync with WorkManager and Hilt-injected dependencies.
    Research: `developer.android.com/training/dependency-injection/hilt-android`,
    `developer.android.com/develop/background-work/background-tasks/persistent`.

11. **`android-testing`** — unit tests, coroutine and Flow virtual time, Compose UI tests, screenshot
    tests, fixtures and the testing pyramid.
    Outcome: write and run a unit test with virtual-time coroutines and a Compose UI test for one
    screen.
    Research: `developer.android.com/kotlin/coroutines/test`,
    `developer.android.com/develop/ui/compose/testing`.

12. **`android-production-quality`** — startup, recomposition, memory, and network profiling; Baseline
    Profiles and jank; R8; secrets, TLS, permissions; crash handling.
    Outcome: profile a screen for jank, apply a Baseline Profile, and handle a crash gracefully.
    Research: `developer.android.com/topic/performance/baselineprofiles/overview`.

13. **`android-release-operations`** — build variants, signing, versioning, CI checks, the targetSdk
    ratchet and behavior-change discipline, Play Console rollout, crash reporting and analytics.
    Outcome: ship a signed, versioned build through a staged Play Console rollout and read a crash
    report.
    Research: `developer.android.com/google/play/requirements/target-sdk` — confirm the current
    required API level and deadline at authoring time, since this is a moving date.

14. **`android-multiplatform-bridge`** — Kotlin Multiplatform and Compose Multiplatform: what logic
    and UI can be shared with the companion Flutter route, and what stays platform-specific.
    Outcome: identify which parts of a feature would port to KMP/CMP and which would not.
    Research: `kotlinlang.org/docs/multiplatform`, the JetBrains Compose Multiplatform for iOS
    stability announcement — confirm current iOS/desktop/web stability status rather than quoting an
    older milestone.

## Draft module sequence — Android maintenance lane (for existing codebases)

Below the required sequence, labeled explicitly for its audience: **for a learner joining a team
with an existing View-based app, or preparing for interviews that still test the View toolkit.**
Depth contract: read and navigate an existing codebase, and interop a Compose screen into it — not
authoring new View-based UI from scratch.

15. **`android-legacy-view-codebases`** — what maintenance mode means and does not mean; layout XML,
    View/ViewGroup, `LayoutInflater`, `findViewById` and the binding generations (Data Binding, View
    Binding, kotlinx synthetics, ButterKnife); AppCompat, Material Components for Android, Toolbar
    and options menus; RecyclerView adapters, ViewHolder, and DiffUtil; Fragments, FragmentManager,
    and the back stack; Navigation 2 with XML graphs and Safe Args.
    Outcome: open an unfamiliar View-based Android app and locate the screen you've been asked to
    change.
    Research: `developer.android.com/develop/ui/compose/first` (the maintenance-mode library list,
    already verified this session), `developer.android.com/guide/fragments`.

16. **`android-legacy-runtime-and-interop`** — AsyncTask, Loaders, IntentService,
    `startActivityForResult`, `onBackPressed` and their modern replacements; RxJava and LiveData at
    the boundary with Flow; raw Dagger 2 → Hilt; SharedPreferences → DataStore; SQLiteOpenHelper →
    Room; `android.support.*` → AndroidX and Groovy → Kotlin DSL with version catalogs; then the
    interop seam itself — `ComposeView`, `AbstractComposeView`, `AndroidView`, hosting a Compose
    screen inside a Fragment, and sequencing an incremental migration.
    Outcome: add a Compose screen to an existing View-based app without rewriting the surrounding
    app.
    Research: `developer.android.com/develop/ui/compose/migrate/interoperability-apis`,
    `developer.android.com/develop/ui/compose/migrate/strategy`.

## Draft module sequence — Flutter core lane (required)

1. **`flutter-foundations`** — SDK, Dart 3 (records, patterns, sealed classes, sound null safety as
   a given), project structure, hot reload, DevTools, Widget Previews.
   Outcome: create, run, and iterate on a minimal Flutter app using hot reload and DevTools.
   Research: `docs.flutter.dev` "Get started," current Dart language-version notes.

2. **`flutter-ui-design-systems`** — widget tree, build and constraints, Material 3 as the default,
   theming, responsive layouts, accessibility, and the in-SDK → `material_ui`/`cupertino_ui` package
   migration.
   Outcome: build a themed, responsive screen on the standalone `material_ui` package rather than the
   deprecated in-SDK import.
   Research: "What's new in Flutter 3.47" (flutter.dev/blog), and
   `docs.flutter.dev/release/breaking-changes/material-3-default` — confirm the exact November 2026
   deprecation timing at authoring time, since it hadn't shipped as of this plan.

3. **`flutter-async-dart`** — Futures, Streams, `FutureBuilder` and `StreamBuilder`, an isolates
   primer.
   Outcome: render loading/data/error UI correctly from a Future- or Stream-backed data source.
   Research: `dart.dev/language/futures`, `docs.flutter.dev` widget catalog entries for
   `FutureBuilder`/`StreamBuilder`.

4. **`flutter-state-management`** — `setState`, `ValueNotifier`, `ChangeNotifier`,
   `InheritedWidget`, then Riverpod and Bloc/Cubit as the two live choices, and how to choose between
   them.
   Outcome: implement the same small feature with Riverpod and explain when Bloc would be preferred
   instead.
   Research: current Riverpod docs (code-generation style) and Bloc docs — confirm which pattern each
   project currently recommends as default, since guidance has shifted version to version.

5. **`flutter-architecture-navigation`** — go_router (typed routes, redirects and guards, nested
   navigation, deep links), MVVM, DI, repositories and use cases, the loading/error/empty/success
   contract, feature boundaries.
   Outcome: wire multi-screen, deep-linkable navigation with go_router and an auth redirect guard.
   Research: `pub.dev/packages/go_router` docs, `verygood.ventures` routing best-practices as a
   secondary source — confirm against the package's own docs first.

6. **`flutter-networking`** — dio or http, JSON with codegen, repositories and mapping, auth and
   token refresh, pagination, retries, cancellation.
   Outcome: call a real API through a repository layer with correct error handling and cancellation.
   Research: `pub.dev/packages/dio`, `dart.dev` json_serializable docs.

7. **`flutter-local-data`** — Drift/SQLite, preferences and secure storage, local source of truth,
   sync and conflicts.
   Outcome: persist and sync data locally with Drift as the source of truth for the UI.
   Research: `drift.simonbinder.eu` docs.

8. **`flutter-platform-integration`** — plugins, method channels, FFI and native interop,
   permissions, camera and files, isolates, push notifications and app links.
   Outcome: call a platform API through a plugin and handle a runtime permission correctly.
   Research: `docs.flutter.dev/platform-integration`.

9. **`flutter-testing`** — unit, widget, integration, and golden tests, fixtures and the pyramid.
   Outcome: write a widget test and a golden test for one screen.
   Research: `docs.flutter.dev/testing`.

10. **`flutter-production-quality`** — Impeller and the frame budget, DevTools, lazy lists, isolates,
    secure storage, TLS, obfuscation, crash handling.
    Outcome: profile a janky list with DevTools and fix it with a lazy-loading widget.
    Research: `docs.flutter.dev/perf`, confirm current Impeller default-platform status (desktop
    default landed in 3.47) rather than an older snapshot.

11. **`flutter-release-operations`** — flavors, signing, versioning, CI checks, Android and iOS
    release tracks including the Play targetSdk ratchet, crash reporting.
    Outcome: ship a signed, flavored build to both a Play internal track and TestFlight.
    Research: `docs.flutter.dev/deployment`, plus the same Play targetSdk source used for the Android
    track's release module — keep the two consistent.

## Draft module sequence — Flutter maintenance lane (for existing codebases)

Labeled for the same audience as the Android maintenance lane: a learner bringing an older Flutter
app forward, not building new features on legacy patterns.

12. **`flutter-legacy-codebases`** — Navigator 1.0 → go_router; `WillPopScope` → `PopScope`;
    Provider → Riverpod or Bloc at the boundary; `useMaterial3: false` themes → Material 3;
    `dart:html` → `package:web`; reading a `pubspec.yaml` and running a dependency-upgrade pass.
    Outcome: bring an older Flutter app onto a current SDK and routing/state approach without a
    rewrite.
    Research: `docs.flutter.dev/release/breaking-changes` index — check specifically for the
    `WillPopScope` and `dart:html` breaking-change entries rather than asserting replacement APIs
    from memory.

**Not covered — archaeology, not lesson material:**

- Pre-null-safety Dart 2 — sound null safety has been mandatory since Dart 3; this code does not
  compile on a current SDK.
- Android embedding v1 — removed from the Flutter engine; no current project can target it.
- `RaisedButton`/`FlatButton` — removed Material widgets, not deprecated-but-present; the current
  replacement (`ElevatedButton`/`TextButton`) is simply what module 2 teaches as core.

## Explicit non-goals

Per `AGENTS.md` ("keep the first release focused"). Do not fold these in without a deliberate scope
decision recorded here first:

- Authoring new View-based Android UI from scratch — out of scope by the "read + interop" depth
  decision above; the maintenance lane teaches navigating and extending an existing View app, not
  building one.
- iOS-native (SwiftUI) content — the companion-track relationship in this course stays Android ↔
  Flutter, per `companionSlug` on both tracks.
- Wear OS, Android TV, Android XR, and Android Automotive — different target-SDK requirements (API
  34/35 vs. 36/37) and a separate product scoping decision, not an extension of this plan.
- Backend work — already owned by the `backend-development` course in the same repo.

## Reading list

Fetched and read directly in this session:

- `developer.android.com/develop/ui/compose/first` — the Compose-first policy statement and the full
  maintenance-mode library list (Fragment, RecyclerView, ViewPager, Navigation 2, and ~18 others),
  plus the Layout Editor / Navigation Editor maintenance-mode statement and the explicit
  no-migration-mandate language. Supports the Findings section and the entire Android maintenance
  lane.

Surfaced by search against primary or first-party domains; **read directly before citing in
lesson content**, per `lesson-contribution-guidelines.md:227-229`:

- Android Developers Blog, "Android UI Development is Compose First" (May 2026) — the original
  announcement post.
- `developer.android.com/guide/navigation/navigation-3` and the `navigation3` AndroidX release notes
  — module 6.
- `developer.android.com/google/play/requirements/target-sdk` — modules 13 and Flutter's 11; confirm
  the current required API level and deadline, since Play's requirement advances yearly.
- `developer.android.com/about/versions/16/behavior-changes-16` and
  `developer.android.com/about/versions/17/behavior-changes-17` — module 5 (edge-to-edge,
  large-screen orientation/resizability).
- Android Developers Blog, "Prepare your app for the resizability and orientation changes in Android
  17" (February 2026) — module 5, companion to the behavior-changes doc.
- `flutter.dev/blog` "What's new in Flutter 3.47" (August 2026) — Flutter module 2
  (`material_ui`/`cupertino_ui` split) and module 10 (Impeller on desktop by default).
- `docs.flutter.dev/release/breaking-changes/material-3-default` — Flutter module 2.
- JetBrains Kotlin Blog, Compose Multiplatform for iOS stability announcement — Android module 14;
  confirm current stability status across iOS/desktop/web at authoring time rather than quoting this
  plan's snapshot.
- `docs.flutter.dev/release/breaking-changes` (index) — Flutter maintenance module 12; check the
  `WillPopScope` and `dart:html`/`package:web` entries specifically.

No other live URLs are recorded as verified beyond the one page actually fetched this session — the
rest were surfaced by search and must be opened and read, not assumed, before writing lesson prose
from them.

## Open questions to settle after the reading pass

- **How should the maintenance lane be represented in data?** Current call: add
  `kind?: 'core' | 'maintenance'` and an `audience?: string` to `CurriculumTrackModule`
  (`src/data/curriculum.ts:36-42`), and render maintenance modules in `TrackView.vue` as a fourth
  section after the existing `03 Planned sequence` block (`src/views/TrackView.vue:112-146`), reusing
  the supplementary visual vocabulary already established for lessons — the dashed top rule from
  `.study-section--supplementary` (`src/style.css:1172-1180`) and a `.study-row-kicker` label. This
  is a separate implementation change from this plan, per
  `lesson-contribution-guidelines.md:241-242` ("track-specific lesson routes" is listed as a known
  current limitation).
- **Is module 14 (`android-multiplatform-bridge`) a module or handoff prose?** The `CurriculumTrack`
  type already has a `handoff` field (line 32) meant for the companion-track relationship. Current
  call: keep it a full module — KMP/CMP has enough independent substance (setup, what's shareable,
  what isn't) to warrant lessons rather than a paragraph.
- **Should the Flutter maintenance lane be one module or folded into core module 2?** Current call:
  keep it a separate module so both tracks present the same two-lane shape, even though Flutter's
  maintenance lane is much thinner than Android's — consistency helps a learner moving between
  tracks.
- **Does the Android core lane need a dedicated coroutines/Flow module?** Currently distributed
  across modules 1 (primer), 7 (StateFlow), and 8 (networking, cancellation). Current call: leave it
  distributed and revisit only if module 7 grows too large to complete in one sitting.

## Known defect to fix in the implementation pass, not here

`src/views/TrackView.vue:124-126` hardcodes *"The **Android** route follows a production-shaped
app…"* inside the `03 Planned sequence` section intro, so that sentence currently renders on the
Flutter track page too. This plan is prose-only and does not touch views; record the fix here so the
implementation pass picks it up.

## Definition of done for this plan

This file is done being a *plan* when each module above has: a confirmed outcome statement, a
research source list actually read (not just named), and a settled core-vs-maintenance placement.
Turning it into real content is a separate pass that follows `lesson-contribution-guidelines.md` in
full — Markdown file, `CurriculumLesson` record, raw import + `markdownByFile` entry, route
verification, and `npm run build`. Rewriting `plannedModules` in `curriculum.ts` to match this
outline, and adding the `kind`/`audience` fields plus the `TrackView.vue` maintenance-lane section,
are both separate implementation changes that should reference this file rather than repeat its
research.
