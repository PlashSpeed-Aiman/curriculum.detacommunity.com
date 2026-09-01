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
            summary: 'Set up a dependable project and learn the platform concepts every production feature rests on.',
            lessons: [
              'Android Studio, SDKs, emulators, and a production-ready project structure',
              'Kotlin essentials and Java/Kotlin interop for reading and extending Android codebases',
              'App components, lifecycle, configuration changes, and process death',
              'Debugging with Logcat, previews, the debugger, and device tools',
            ],
          },
          {
            id: 'android-views-xml',
            number: '02',
            title: 'Classical Android views and XML layouts',
            summary: 'Maintain the View-based UI stack found in established applications and understand how screens become real views.',
            lessons: [
              'XML resources, styles, themes, dimensions, and resource qualifiers',
              'Views, ViewGroups, and inflating layouts with LayoutInflater',
              'View Binding, Data Binding, and incremental migration in an existing app',
              'RecyclerView, adapters, ViewHolders, and custom views',
            ],
          },
          {
            id: 'android-fragments-navigation',
            number: '03',
            title: 'Classical activities, fragments, and navigation',
            summary: 'Trace screen behavior through the Activity and Fragment APIs so legacy navigation can be fixed without guesswork.',
            lessons: [
              'Activity and Fragment lifecycles, FragmentManager, transactions, and the back stack',
              'Fragment arguments, FragmentResult, saved state, and configuration changes',
              'Navigation Component, XML graphs, deep links, and legacy back stacks',
              'Common fragment bugs: view lifecycles, state loss, leaks, and retained references',
            ],
          },
          {
            id: 'android-async-migration',
            number: '04',
            title: 'Legacy async work and modern replacements',
            summary: 'Maintain older concurrency code safely, then choose the right modern primitive when replacing it.',
            lessons: [
              'AsyncTask: lifecycle, cancellation, thread boundaries, and why it was deprecated',
              'Threads, Handler, Looper, callbacks, and RxJava in existing applications',
              'Replacing AsyncTask with Kotlin coroutines, lifecycleScope, viewModelScope, and dispatchers',
              'Choosing between Flow, WorkManager, and foreground work for modern Android behavior',
            ],
          },
          {
            id: 'android-legacy-migrations',
            number: '05',
            title: 'Legacy libraries and migration bridges',
            summary: 'Recognize the dependencies and patterns found in older apps, then modernize them incrementally without a risky rewrite.',
            lessons: [
              'Android support libraries, AndroidX migration, Kotlin synthetics, and ButterKnife cleanup',
              'RxJava and LiveData in existing codebases, including boundaries with coroutines and Flow',
              'Manual Dagger components, scopes, and a step-by-step migration to Hilt',
              'Data Binding to View Binding or Compose, SharedPreferences to DataStore, and SQLiteOpenHelper to Room',
              'Activity Result APIs and other small migrations that reduce deprecated platform usage',
            ],
          },
          {
            id: 'android-compose-ui',
            number: '06',
            title: 'Modern Android UI with Compose',
            summary: 'Build new screens with a declarative UI model while keeping a clear bridge to existing View-based code.',
            lessons: [
              'Compose and Views together: ComposeView, AndroidView, and incremental migration',
              'Composition, recomposition, and state in Jetpack Compose',
              'Material 3 theming, typography, color, and reusable components',
              'Responsive layouts and accessibility for phones, tablets, and foldables',
            ],
          },
          {
            id: 'android-architecture-navigation',
            number: '07',
            title: 'Modern architecture and navigation',
            summary: 'Make new screen behavior predictable with explicit state, feature boundaries, and resilient navigation.',
            lessons: [
              'Navigation Compose, back stack behavior, and deep links',
              'MVVM in Android: separating UI, ViewModel, UI state, and domain responsibilities',
              'ViewModel, StateFlow, coroutines, and unidirectional data flow',
              'Loading, error, empty, and success states as a deliberate UI contract',
              'Feature boundaries, dependency direction, and maintainable packages',
            ],
          },
          {
            id: 'android-networking',
            number: '08',
            title: 'Networking and API integration',
            summary: 'Connect the app to a real service without leaking transport details into the UI.',
            lessons: [
              'HTTP contracts, JSON, Kotlin Serialization, Retrofit, and OkHttp',
              'Repositories and mapping DTOs into stable domain models',
              'Authentication, token refresh, and secure session state',
              'Pagination, retries, cancellation, and failure mapping',
            ],
          },
          {
            id: 'android-local-data',
            number: '09',
            title: 'Local data and offline-first behavior',
            summary: 'Give the app useful behavior when the network is slow, absent, or inconsistent.',
            lessons: [
              'Room schemas, DAOs, migrations, and database inspection',
              'DataStore for preferences, settings, and lightweight state',
              'A local source of truth for cached and remote data',
              'Synchronization, cache invalidation, and conflict decisions',
            ],
          },
          {
            id: 'android-background-work',
            number: '10',
            title: 'Dependency injection and background work',
            summary: 'Move work out of the UI safely and make dependencies explicit from development to release.',
            lessons: [
              'Hilt components, modules, qualifiers, and scopes',
              'WorkManager constraints, retries, and idempotent jobs',
              'Connectivity-aware background synchronization',
              'Notifications, channels, and user-controlled reminders',
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
              'Fixtures, fakes, test boundaries, and the testing pyramid',
            ],
          },
          {
            id: 'android-production-quality',
            number: '12',
            title: 'Performance, security, and resilience',
            summary: 'Find the issues users feel in production and protect the data and trust they bring to the app.',
            lessons: [
              'Startup, recomposition, memory, and network cost measurement',
              'Baseline Profiles, tracing, and avoiding UI jank',
              'Secrets, secure storage, TLS, and least-privilege permissions',
              'Crash handling, graceful degradation, and observable errors',
            ],
          },
          {
            id: 'android-release-operations',
            number: '13',
            title: 'Release and operations',
            summary: 'Turn a working app into a release process that can be repeated, observed, and safely rolled back.',
            lessons: [
              'Build variants, signing, versioning, and environment configuration',
              'CI checks for formatting, tests, and release builds',
              'Play Console tracks, staged rollout, and rollback',
              'Crash reporting, analytics boundaries, and post-release feedback',
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
            summary: 'Set up a dependable cross-platform project and learn the language and runtime concepts every feature rests on.',
            lessons: [
              'Flutter SDK, Dart, emulators, and a production-ready project structure',
              'Dart 3 essentials: sound null safety, records, patterns, sealed types, and extensions',
              'Flutter app lifecycle, widget lifecycle, and state restoration',
              'Debugging with hot reload, DevTools, the inspector, and device logs',
            ],
          },
          {
            id: 'flutter-legacy-migrations',
            number: '02',
            title: 'Legacy Flutter codebases and migration bridges',
            summary: 'Read older Flutter apps confidently and migrate Dart, navigation, plugins, and Material APIs without a full rewrite.',
            lessons: [
              'Pre-null-safety Dart, old Flutter project structures, and dependency upgrades',
              'Android embedding v1 to v2, plugin APIs, and platform channels',
              'Imperative Navigator 1.0, named routes, and migration toward Router or go_router',
              'Legacy Material APIs such as RaisedButton, FlatButton, and WillPopScope',
              'Callback-heavy async code, FutureBuilder, StreamBuilder, and incremental refactoring',
            ],
          },
          {
            id: 'flutter-ui-design-systems',
            number: '03',
            title: 'Widget UI and design systems',
            summary: 'Build a consistent interface with composable widgets and layouts that adapt across mobile form factors.',
            lessons: [
              'The widget tree, build method, constraints, and composition',
              'Material 3 theming, typography, color, and reusable widgets',
              'Responsive layouts for phones, tablets, and foldables',
              'Accessibility with semantics, TalkBack, VoiceOver, touch targets, and contrast',
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
              'BLoC and RxDart compared with plain Streams, Provider, and Riverpod',
              'Choosing a state model for local, shared, server, and form state',
            ],
          },
          {
            id: 'flutter-architecture-navigation',
            number: '05',
            title: 'Architecture and navigation',
            summary: 'Make screen behavior predictable with explicit state, feature boundaries, and resilient cross-platform navigation.',
            lessons: [
              'Declarative navigation, back stack behavior, and deep links',
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
            summary: 'Connect the app to a real service without leaking transport details into widgets or ViewModels.',
            lessons: [
              'HTTP with Dio, JSON serialization, and generated models',
              'Repositories, services, and mapping transport data to domain models',
              'Authentication, token refresh, and secure session state',
              'Pagination, retries, cancellation, and failure mapping',
            ],
          },
          {
            id: 'flutter-local-data',
            number: '07',
            title: 'Local data and offline-first behavior',
            summary: 'Give the app useful behavior when the network is slow, absent, or inconsistent on either platform.',
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
              'Platform plugins, method channels, and native Android and iOS boundaries',
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
              'Flutter DevTools: frame budget, rebuilds, memory, and network cost',
              'Rendering performance, lazy lists, images, and isolates',
              'Secure storage, TLS, obfuscation, and least-privilege permissions',
              'Crash handling, graceful degradation, and observable errors',
            ],
          },
          {
            id: 'flutter-release-operations',
            number: '11',
            title: 'Cross-platform release and operations',
            summary: 'Turn a shared codebase into a release process that can be repeated, observed, and safely rolled back.',
            lessons: [
              'Flavors, signing, versioning, and environment configuration',
              'CI checks for analyze, formatting, tests, and release builds',
              'Android and iOS release tracks, staged rollout, and rollback',
              'Crash reporting, analytics boundaries, and post-release feedback',
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
