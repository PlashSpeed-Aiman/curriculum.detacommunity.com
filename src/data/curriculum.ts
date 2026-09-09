export interface CurriculumLesson {
  id: string
  slug: string
  title: string
  summary: string
  contentFile: string
  readTime: string
  category: string
}

export interface CurriculumModule {
  id: string
  number: string
  slug: string
  title: string
  summary: string
  lessons: CurriculumLesson[]
  supplementaryLessons?: CurriculumLesson[]
}

export interface CurriculumTrack {
  id: string
  slug: string
  title: string
  summary: string
  status: 'placeholder'
  routeLabel: string
  stack: string
  sharedFoundations: string[]
  focusAreas: string[]
  companionSlug: string
  handoff: string
  plannedModules?: CurriculumTrackModule[]
}

export interface CurriculumTrackModule {
  id: string
  number: string
  title: string
  summary: string
  lessons: string[]
}

export interface CurriculumSubject {
  id: string
  number: string
  title: string
  why: string
  duration: string
  accent: 'coral' | 'gold' | 'blue'
  modules?: CurriculumModule[]
  tracks?: CurriculumTrack[]
}

const mobileSharedFoundations = [
  'Mobile product foundations: screens, states, and user flows',
  'Asynchronous work: APIs, loading, errors, and offline edges',
  'Application structure: navigation, state, testing, and release',
]

export const curriculumSubjects: CurriculumSubject[] = [
  {
    id: 'docker',
    number: '01',
    title: 'Docker',
    why: 'Package, run, and understand applications without losing sight of what is underneath.',
    duration: '4 weeks',
    accent: 'coral',
    modules: [
      {
        id: 'docker-basics',
        number: '01',
        slug: 'basics',
        title: 'Docker basics (setup, running your first application)',
        summary: 'Install Docker, verify the daemon, and run a first container.',
        lessons: [
          {
            id: 'docker-basics-setup',
            slug: 'setup',
            title: 'Setup and run your first application',
            summary: 'Install Docker, verify the CLI, and run a container from an image.',
            contentFile: 'docker-basics.md',
            readTime: '10 min',
            category: 'Docker / foundations',
          },
        ],
        supplementaryLessons: [
          {
            id: 'docker-basics-mysql-dbeaver',
            slug: 'mysql-with-dbeaver',
            title: 'Run MySQL with Docker and query it with DBeaver',
            summary: 'Start a persistent MySQL container, connect with DBeaver, and run your first queries.',
            contentFile: 'docker-mysql-dbeaver.md',
            readTime: '20 min',
            category: 'Docker / databases',
          },
          {
            id: 'docker-basics-what-is-docker',
            slug: 'what-is-docker',
            title: 'If your friend asks what is Docker? Tell them this',
            summary: 'Explain Docker in plain words: the problems it solves, images and containers, and the Linux namespaces and cgroups underneath.',
            contentFile: 'docker-basics-what-is-docker.md',
            readTime: '12 min',
            category: 'Docker / foundations',
          },
        ],
      },
      {
        id: 'dockerfiles',
        number: '02',
        slug: 'dockerfiles',
        title: 'Dockerfiles',
        summary: 'Package an application with repeatable image instructions.',
        lessons: [
          {
            id: 'dockerfiles-first-image',
            slug: 'first-image',
            title: 'Write your first Dockerfile',
            summary: 'Turn a small web page into a custom image and run it as a container.',
            contentFile: 'dockerfile-first-image.md',
            readTime: '12 min',
            category: 'Docker / Dockerfiles',
          },
          {
            id: 'dockerfiles-build-context',
            slug: 'build-context-and-cache',
            title: 'Understand build context and cache',
            summary: 'Keep builds safe and fast by controlling context, layers, and cache invalidation.',
            contentFile: 'dockerfile-build-context-and-cache.md',
            readTime: '15 min',
            category: 'Docker / Dockerfiles',
          },
          {
            id: 'dockerfiles-multi-stage-production',
            slug: 'multi-stage-production',
            title: 'Build a smaller production image',
            summary: 'Separate build tools from runtime files with a multi-stage Dockerfile.',
            contentFile: 'dockerfile-multi-stage-production.md',
            readTime: '18 min',
            category: 'Docker / Dockerfiles',
          },
        ],
        supplementaryLessons: [
          {
            id: 'dockerfiles-image-layers-deep-dive',
            slug: 'image-layers-deep-dive',
            title: 'Deep-dive: diffing image layers',
            summary: 'Inspect build history, layer archives, whiteouts, and container changes step by step.',
            contentFile: 'dockerfile-image-layers-deep-dive.md',
            readTime: '20 min',
            category: 'Docker / deep dive',
          },
          {
            id: 'dockerfiles-instructions-and-build-arguments',
            slug: 'instructions-and-build-arguments',
            title: 'Reference: Dockerfile instructions and build arguments',
            summary: 'Choose instructions deliberately, scope ARGs correctly, and keep configuration and secrets out of the wrong layer.',
            contentFile: 'dockerfile-instructions-and-build-arguments.md',
            readTime: '25 min',
            category: 'Docker / reference',
          },
          {
            id: 'dockerfiles-secrets-env-arg',
            slug: 'secrets-env-arg',
            title: 'How to host a buffet for your attackers: secrets, ENV, and ARG in Dockerfiles',
            summary: 'Watch a token passed through ENV and ARG surface in image history, metadata, and layers, then see secret mounts and multi-stage builds close the door.',
            contentFile: 'dockerfile-secrets-env-arg.md',
            readTime: '16 min',
            category: 'Docker / deep dive',
          },
        ],
      },
      {
        id: 'docker-compose',
        number: '03',
        slug: 'compose',
        title: 'Docker Compose (networking, volumes, and more)',
        summary: 'Describe multi-service local development with predictable dependencies.',
        lessons: [
          {
            id: 'docker-compose-yaml',
            slug: 'yaml-for-compose',
            title: 'YAML for Compose',
            summary: 'Read and write the YAML structures Compose uses for services, ports, and configuration.',
            contentFile: 'docker-compose-yaml.md',
            readTime: '14 min',
            category: 'Docker / Compose',
          },
          {
            id: 'docker-compose-first-project',
            slug: 'first-compose-project',
            title: 'Build your first Compose project',
            summary: 'Describe a web and database stack, then operate it with the Compose lifecycle commands.',
            contentFile: 'docker-compose-first-project.md',
            readTime: '18 min',
            category: 'Docker / Compose',
          },
          {
            id: 'docker-compose-networking',
            slug: 'networking-and-service-discovery',
            title: 'Networking and service discovery',
            summary: 'Connect services by name and distinguish internal container ports from host-published ports.',
            contentFile: 'docker-compose-networking.md',
            readTime: '18 min',
            category: 'Docker / Compose',
          },
          {
            id: 'docker-compose-volumes',
            slug: 'volumes-and-persistence',
            title: 'Volumes and persistence',
            summary: 'Keep database data across container replacement with named volumes and deliberate cleanup.',
            contentFile: 'docker-compose-volumes.md',
            readTime: '18 min',
            category: 'Docker / Compose',
          },
          {
            id: 'docker-compose-configuration-readiness',
            slug: 'configuration-and-readiness',
            title: 'Configuration and readiness',
            summary: 'Separate interpolation from container environment and gate startup with a meaningful healthcheck.',
            contentFile: 'docker-compose-configuration-readiness.md',
            readTime: '20 min',
            category: 'Docker / Compose',
          },
          {
            id: 'docker-compose-external-networks',
            slug: 'shared-external-networks',
            title: 'Shared external networks',
            summary: 'Let two Compose projects discover selected services on one explicitly managed Docker network.',
            contentFile: 'docker-compose-external-networks.md',
            readTime: '18 min',
            category: 'Docker / Compose',
          },
        ],
        supplementaryLessons: [
          {
            id: 'docker-compose-log-rotation-war-story',
            slug: 'log-rotation-war-story',
            title: 'War story: the 11 GB container log that filled the disk',
            summary: 'Follow a MongoDB crash loop back to unrotated json-file logs, then apply Compose log rotation that would have prevented it.',
            contentFile: 'docker-compose-log-rotation-war-story.md',
            readTime: '14 min',
            category: 'Docker / Compose',
          },
        ],
      },
      {
        id: 'docker-deep-dive',
        number: '04',
        slug: 'deep-dive',
        title: 'Docker deep-dive (LXC, cgroups, namespaces)',
        summary: 'Understand the Linux primitives that make containers possible.',
        lessons: [],
      },
    ],
  },
  {
    id: 'mobile-app-development',
    number: '02',
    title: 'Mobile app development',
    why: 'Build apps for people on the move, with a native Android path or a cross-platform Flutter path.',
    duration: '2 tracks',
    accent: 'gold',
    tracks: [
      {
        id: 'android',
        slug: 'android',
        title: 'Android',
        summary: 'Learn the classical Android stack for maintaining existing applications, then build new features with Kotlin and modern Jetpack tools.',
        status: 'placeholder',
        routeLabel: 'Native Android path',
        stack: 'Kotlin + Jetpack',
        sharedFoundations: mobileSharedFoundations,
        focusAreas: [
          'Classical Android: Views, XML, fragments, and legacy maintenance',
          'Legacy libraries and incremental migration',
          'Modern Android: Kotlin, Jetpack Compose, and declarative UI',
          'Lifecycle, configuration, permissions, and platform APIs',
        ],
        companionSlug: 'flutter',
        handoff: 'If you start in Flutter, your instincts for UI composition, state, async work, and API-driven screens carry over. Android adds the platform lifecycle, Kotlin, Jetpack, and native tooling.',
        plannedModules: [
          {
            id: 'android-foundations',
            number: '01',
            title: 'Kotlin and Android foundations',
            summary: 'Create and debug a minimal Android project with a current toolchain.',
            lessons: [
              'Android Studio, SDKs, emulators, project structure, and Gradle Kotlin DSL',
              'Version catalogs, Kotlin 2.x essentials, and Java/Kotlin interop',
              'Kotlin coroutines primer: suspend functions, structured concurrency, and dispatchers',
              'Debugging with Logcat, the debugger, previews, and device tools',
            ],
          },
          {
            id: 'android-platform-contract',
            number: '02',
            title: 'Android platform contract',
            summary: 'Understand the operating-system contract that remains essential regardless of the UI toolkit.',
            lessons: [
              'App components and the single-Activity model',
              'Activity lifecycle, configuration changes, process death, and savedInstanceState',
              'The res/ resource system, qualifiers, AndroidManifest.xml, intents, and permissions',
              'The Activity Result API and preserving state across Activity recreation',
            ],
          },
          {
            id: 'android-compose-fundamentals',
            number: '03',
            title: 'Compose fundamentals',
            summary: 'Build a Compose screen with correctly hoisted state that survives recomposition and configuration changes.',
            lessons: [
              'Composition, recomposition, and the mental model of declarative UI',
              'State hoisting, remember, rememberSaveable, and state ownership',
              'Side-effect APIs and lifecycle-aware effects',
              'Layout, modifiers, constraints, and reusable composables',
            ],
          },
          {
            id: 'android-material-design',
            number: '04',
            title: 'Material design systems',
            summary: 'Theme a Compose screen with Material 3 and verify its core accessibility requirements.',
            lessons: [
              'Material 3 theming, dynamic color, typography, and components',
              'Design tokens, reusable components, and maintaining a coherent theme',
              'Accessibility semantics, TalkBack, contrast, and touch targets',
            ],
          },
          {
            id: 'android-adaptive-ui',
            number: '05',
            title: 'Adaptive UI and platform behavior',
            summary: 'Make a screen work across phones, tablets, foldables, and the current Android windowing rules.',
            lessons: [
              'Window size classes, adaptive layouts, and multi-pane experiences',
              'Foldables, large screens, orientation, and resizability',
              'Edge-to-edge, insets, system bars, and predictive back',
            ],
          },
          {
            id: 'android-navigation3',
            number: '06',
            title: 'Navigation 3',
            summary: 'Wire multi-screen navigation with an owned back stack, type-safe routes, and adaptive destinations.',
            lessons: [
              'Back stack ownership, entries, and scenes',
              'Scene Decorators for bars, rails, dialogs, and shared chrome',
              'Type-safe routes, deep links, and restoring navigation state',
              'Adaptive list-detail navigation across window sizes',
            ],
          },
          {
            id: 'android-architecture-state',
            number: '07',
            title: 'Architecture and state',
            summary: 'Structure a feature with a ViewModel, StateFlow, unidirectional data flow, and explicit UI states.',
            lessons: [
              'MVVM, unidirectional data flow, and feature boundaries',
              'ViewModel, StateFlow, coroutines, and state ownership',
              'Loading, error, empty, and success states as a deliberate UI contract',
              'Dependency direction and maintainable feature packages',
            ],
          },
          {
            id: 'android-networking',
            number: '08',
            title: 'Networking and API integration',
            summary: 'Call a real API through a repository layer with correct error handling and cancellation.',
            lessons: [
              'HTTP contracts, JSON, kotlinx.serialization, and Retrofit/OkHttp or Ktor',
              'Repositories and mapping DTOs into stable domain models',
              'Authentication, token refresh, and secure session state',
              'Pagination, retries, cancellation, and failure mapping',
            ],
          },
          {
            id: 'android-local-data',
            number: '09',
            title: 'Local data and offline-first behavior',
            summary: 'Persist and synchronize data locally with Room and DataStore as the source of truth for the UI.',
            lessons: [
              'Room schemas, DAOs, migrations, and database inspection',
              'DataStore for preferences, settings, and lightweight state',
              'A local source of truth for cached and remote data',
              'Synchronization, cache invalidation, and conflict decisions',
            ],
          },
          {
            id: 'android-di-background-work',
            number: '10',
            title: 'Dependency injection and background work',
            summary: 'Schedule reliable background work with Hilt-injected dependencies and current platform constraints.',
            lessons: [
              'Hilt components, modules, qualifiers, and scopes',
              'WorkManager constraints, retries, idempotent jobs, and foreground service types',
              'Connectivity-aware synchronization and reliable rescheduling',
              'Notifications, channels, and the runtime notification permission',
            ],
          },
          {
            id: 'android-testing',
            number: '11',
            title: 'Testing and engineering confidence',
            summary: 'Test the behavior that matters without making the codebase slow or brittle to change.',
            lessons: [
              'Unit tests for use cases, ViewModels, and repositories',
              'Testing coroutines and Flow with deterministic virtual time',
              'Compose UI tests with semantics, navigation, and fake data',
              'Screenshot tests, fixtures, fakes, test boundaries, and the testing pyramid',
            ],
          },
          {
            id: 'android-production-quality',
            number: '12',
            title: 'Performance, security, and resilience',
            summary: 'Find the issues users feel in production and protect the data and trust they bring to the app.',
            lessons: [
              'Startup, recomposition, memory, and network profiling',
              'Baseline Profiles, tracing, and avoiding UI jank',
              'R8, secrets, secure storage, TLS, and least-privilege permissions',
              'Crash handling, graceful degradation, and observable errors',
            ],
          },
          {
            id: 'android-release-operations',
            number: '13',
            title: 'Release and operations',
            summary: 'Ship a signed build through a staged rollout and keep pace with Android and Play platform changes.',
            lessons: [
              'Build variants, signing, versioning, and environment configuration',
              'CI checks for formatting, tests, and release builds',
              'The targetSdk ratchet and behavior-change discipline',
              'Play Console tracks, staged rollout, crash reporting, and analytics boundaries',
            ],
          },
          {
            id: 'android-multiplatform-bridge',
            number: '14',
            title: 'Kotlin and Compose Multiplatform bridge',
            summary: 'Identify which parts of a feature could be shared with Kotlin Multiplatform or Compose Multiplatform and which stay platform-specific.',
            lessons: [
              'Kotlin Multiplatform project structure and shareable domain logic',
              'Compose Multiplatform UI sharing and platform-specific boundaries',
              'Choosing what to share across Android, iOS, desktop, and the companion Flutter route',
              'Trade-offs between shared code, native APIs, and independent platform UX',
            ],
          },
          {
            id: 'android-legacy-view-codebases',
            number: '15',
            title: 'Maintenance: View-based Android codebases',
            summary: 'For learners joining an existing View-based app: locate and understand a screen without authoring new View UI from scratch.',
            lessons: [
              'Maintenance mode, layout XML, Views, ViewGroups, LayoutInflater, and findViewById',
              'Data Binding, View Binding, Kotlin synthetics, ButterKnife, and incremental cleanup',
              'AppCompat, Material Components, Toolbar, options menus, and resource conventions',
              'RecyclerView adapters, ViewHolder, DiffUtil, Fragments, FragmentManager, and the back stack',
              'Navigation 2, XML graphs, Safe Args, and tracing an unfamiliar screen through the app',
            ],
          },
          {
            id: 'android-legacy-runtime-and-interop',
            number: '16',
            title: 'Maintenance: Android runtime and interop',
            summary: 'Add a Compose screen to an existing View-based app while replacing legacy runtime and dependency patterns at the boundary.',
            lessons: [
              'AsyncTask, Loaders, IntentService, startActivityForResult, onBackPressed, and their current replacements',
              'RxJava and LiveData at the boundary with coroutines, Flow, and StateFlow',
              'Raw Dagger 2 components, scopes, and an incremental migration to Hilt',
              'SharedPreferences to DataStore, SQLiteOpenHelper to Room, support libraries to AndroidX, and Groovy to Kotlin DSL',
              'ComposeView, AbstractComposeView, AndroidView, and hosting Compose inside a Fragment',
            ],
          },
        ],
      },
      {
        id: 'flutter',
        slug: 'flutter',
        title: 'Flutter',
        summary: 'Maintain established Flutter applications across older Dart and Flutter APIs, then build new features with current widgets, state, and platform tools.',
        status: 'placeholder',
        routeLabel: 'Cross-platform path',
        stack: 'Dart + Flutter',
        sharedFoundations: mobileSharedFoundations,
        focusAreas: [
          'Dart and the Flutter toolchain',
          'Legacy Flutter maintenance and incremental migration',
          'Widgets, rendering, state management, and platform channels',
          'Shared product code, responsive UI, and cross-platform release',
        ],
        companionSlug: 'android',
        handoff: 'If you start in Android, your instincts for architecture, lifecycle, networking, and platform constraints carry over. Flutter adds Dart, a widget tree, and a shared rendering model.',
        plannedModules: [
          {
            id: 'flutter-foundations',
            number: '01',
            title: 'Dart and Flutter foundations',
            summary: 'Create, run, and iterate on a minimal Flutter app using hot reload and DevTools.',
            lessons: [
              'Flutter SDK, Dart 3, emulators, and a production-ready project structure',
              'Sound null safety, records, patterns, sealed classes, and extensions',
              'Hot reload, Widget Previews, DevTools, and the inspector',
              'Flutter app lifecycle, widget lifecycle, state restoration, and device logs',
            ],
          },
          {
            id: 'flutter-ui-design-systems',
            number: '02',
            title: 'Widget UI and design systems',
            summary: 'Build a themed, responsive screen with current Flutter design-system packages.',
            lessons: [
              'The widget tree, build method, constraints, and composition',
              'Material 3 theming, typography, color, and reusable widgets',
              'Responsive layouts for phones, tablets, and foldables',
              'Accessibility with semantics, TalkBack, VoiceOver, touch targets, and contrast',
              'Migrating in-SDK Material and Cupertino imports to the material_ui and cupertino_ui packages',
            ],
          },
          {
            id: 'flutter-async-dart',
            number: '03',
            title: 'Dart asynchronous work',
            summary: 'Render loading, data, and error UI correctly from Future- and Stream-backed data sources.',
            lessons: [
              'Futures, async/await, completion, and error handling',
              'Streams, subscriptions, cancellation, and asynchronous events',
              'FutureBuilder and StreamBuilder for loading, data, and error UI',
              'Isolates and choosing when work should leave the UI isolate',
            ],
          },
          {
            id: 'flutter-state-management',
            number: '04',
            title: 'State management: compare and choose',
            summary: 'Understand the trade-offs between local state, Streams, Provider, Riverpod, and BLoC before standardizing a feature.',
            lessons: [
              'Local state with setState, ValueNotifier, and ChangeNotifier',
              'Streams and StreamController: events, subscriptions, cancellation, and asynchronous state',
              'Provider and InheritedWidget: dependency propagation, rebuilds, and legacy code',
              'Riverpod providers, AsyncValue, scoping, lifecycle, and testing',
              'Bloc/Cubit and RxDart compared with plain Streams, Provider, and Riverpod',
              'Choosing a state model for local, shared, server, and form state',
            ],
          },
          {
            id: 'flutter-architecture-navigation',
            number: '05',
            title: 'Architecture and navigation',
            summary: 'Make screen behavior predictable with explicit state, feature boundaries, and resilient cross-platform navigation.',
            lessons: [
              'go_router: typed routes, redirects and guards, nested navigation, and deep links',
              'MVVM in Flutter: ViewModels, UI state, and view responsibilities',
              'Dependency injection, repositories, and use-case orchestration',
              'Loading, error, empty, and success states as a deliberate UI contract',
              'Feature boundaries, dependency direction, and maintainable packages',
            ],
          },
          {
            id: 'flutter-networking',
            number: '06',
            title: 'Networking and API integration',
            summary: 'Call a real API through a repository layer with correct error handling and cancellation.',
            lessons: [
              'HTTP with Dio or package:http, JSON serialization, and generated models',
              'Repositories, services, and mapping transport data to domain models',
              'Authentication, token refresh, and secure session state',
              'Pagination, retries, cancellation, and failure mapping',
            ],
          },
          {
            id: 'flutter-local-data',
            number: '07',
            title: 'Local data and offline-first behavior',
            summary: 'Persist and synchronize data locally with Drift as the source of truth for the UI.',
            lessons: [
              'SQLite with Drift: schemas, queries, migrations, and inspection',
              'Preferences, secure storage, and separating secrets from settings',
              'A local source of truth for cached and remote data',
              'Synchronization, cache invalidation, and conflict decisions',
            ],
          },
          {
            id: 'flutter-platform-integration',
            number: '08',
            title: 'Platform integration and background work',
            summary: 'Know when shared Dart code is enough and when the native Android or iOS layer should take over.',
            lessons: [
              'Platform plugins, method channels, FFI, and native Android and iOS boundaries',
              'Permissions, lifecycle, camera, files, and platform-specific UX',
              'Background work, isolates, and platform schedulers',
              'Push notifications, app links, and notification routing',
            ],
          },
          {
            id: 'flutter-testing',
            number: '09',
            title: 'Testing and engineering confidence',
            summary: 'Test shared behavior and platform edges without making the codebase slow or brittle to change.',
            lessons: [
              'Dart unit tests for domain logic, ViewModels, and repositories',
              'Widget tests with fakes, semantics, and deterministic state',
              'Integration tests across navigation, persistence, and platform boundaries',
              'Golden tests without making the interface brittle',
              'Fixtures, test environments, and the testing pyramid',
            ],
          },
          {
            id: 'flutter-production-quality',
            number: '10',
            title: 'Performance, security, and resilience',
            summary: 'Find the issues users feel in production and protect the data and trust they bring to the app.',
            lessons: [
              'Impeller, Flutter DevTools, frame budget, rebuilds, memory, and network cost',
              'Rendering performance, lazy lists, images, and isolates',
              'Secure storage, TLS, obfuscation, and least-privilege permissions',
              'Crash handling, graceful degradation, and observable errors',
            ],
          },
          {
            id: 'flutter-release-operations',
            number: '11',
            title: 'Cross-platform release and operations',
            summary: 'Ship a signed, flavored build to both a Play internal track and TestFlight.',
            lessons: [
              'Flavors, signing, versioning, and environment configuration',
              'CI checks for analyze, formatting, tests, and release builds',
              'Android and iOS release tracks, staged rollout, rollback, and the Play targetSdk ratchet',
              'Crash reporting, analytics boundaries, and post-release feedback',
            ],
          },
          {
            id: 'flutter-legacy-codebases',
            number: '12',
            title: 'Maintenance: Legacy Flutter codebases',
            summary: 'Bring an existing Flutter app onto a current SDK and routing/state approach without a rewrite.',
            lessons: [
              'Navigator 1.0 to go_router, including routes, redirects, guards, and nested navigation',
              'WillPopScope to PopScope and other lifecycle or navigation API updates',
              'Provider boundaries to Riverpod or Bloc without rewriting every feature',
              'useMaterial3: false themes to current Material 3 design systems',
              'dart:html to package:web, pubspec.yaml reading, and a disciplined dependency-upgrade pass',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'backend-development',
    number: '03',
    title: 'Backend development',
    why: 'Build reliable web services with ASP.NET Core and persist real data with MySQL.',
    duration: '7 modules',
    accent: 'blue',
    modules: [
      {
        id: 'backend-web-foundations',
        number: '01',
        slug: 'web-foundations',
        title: 'Web and API foundations',
        summary: 'HTTP, REST, JSON, status codes, and how a request moves.',
        lessons: [],
      },
      {
        id: 'backend-aspnet-core',
        number: '02',
        slug: 'aspnet-core',
        title: 'ASP.NET Core fundamentals',
        summary: 'Build a strong foundation with the .NET web application stack.',
        lessons: [],
      },
      {
        id: 'backend-rest-apis',
        number: '03',
        slug: 'rest-apis',
        title: 'Building REST APIs',
        summary: 'Design routes, handle requests, validate input, and return useful responses.',
        lessons: [],
      },
      {
        id: 'backend-mysql',
        number: '04',
        slug: 'mysql',
        title: 'MySQL and relational data modeling',
        summary: 'Design schemas and use SQL to work with structured application data.',
        lessons: [],
      },
      {
        id: 'backend-ef-core-mysql',
        number: '05',
        slug: 'ef-core-mysql',
        title: 'Entity Framework Core with MySQL',
        summary: 'Connect an ASP.NET Core service to MySQL with a maintainable data layer.',
        lessons: [],
      },
      {
        id: 'backend-auth-validation',
        number: '06',
        slug: 'auth-validation',
        title: 'Authentication and validation',
        summary: 'Protect endpoints, validate boundaries, and handle failure clearly.',
        lessons: [],
      },
      {
        id: 'backend-testing-deployment',
        number: '07',
        slug: 'testing-deployment',
        title: 'Testing and deployment',
        summary: 'Give backend code confidence and get it running outside your laptop.',
        lessons: [],
      },
    ],
  },
  {
    id: 'mathematics',
    number: '04',
    title: 'Discrete mathematics',
    why: 'Use logic, probability, and graphs to sharpen technical intuition.',
    duration: '8 weeks',
    accent: 'gold',
  },
  {
    id: 'operating-systems',
    number: '05',
    title: 'Operating systems',
    why: 'Understand the layer that gives software memory, processes, and time.',
    duration: '8 weeks',
    accent: 'coral',
  },
  {
    id: 'networking',
    number: '06',
    title: 'Computer networking',
    why: 'Follow a request across the internet and understand every handoff.',
    duration: '6 weeks',
    accent: 'blue',
  },
  {
    id: 'databases',
    number: '07',
    title: 'Databases',
    why: 'Learn how systems store, find, protect, and move important data.',
    duration: '7 weeks',
    accent: 'coral',
  },
  {
    id: 'languages',
    number: '08',
    title: 'Languages and compilers',
    why: 'Go below syntax to see how ideas become instructions a machine can run.',
    duration: '9 weeks',
    accent: 'gold',
  },
  {
    id: 'distributed-systems',
    number: '09',
    title: 'Distributed systems',
    why: 'Reason about reliability, trade-offs, and software spread across machines.',
    duration: '10 weeks',
    accent: 'blue',
  },
]
