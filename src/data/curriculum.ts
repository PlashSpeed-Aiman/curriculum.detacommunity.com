export interface CurriculumLesson {
  id: string
  slug: string
  title: string
  summary: string
  contentFile: string
}

export interface CurriculumModule {
  id: string
  number: string
  slug: string
  title: string
  summary: string
  lessons: CurriculumLesson[]
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
          },
        ],
      },
      {
        id: 'dockerfiles',
        number: '02',
        slug: 'dockerfiles',
        title: 'Dockerfiles',
        summary: 'Package an application with repeatable image instructions.',
        lessons: [],
      },
      {
        id: 'docker-compose',
        number: '03',
        slug: 'compose',
        title: 'Docker Compose (networking, volumes, and more)',
        summary: 'Describe multi-service local development with predictable dependencies.',
        lessons: [],
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
        summary: 'Learn the native Android layer with Kotlin and Jetpack, then carry your mobile foundations into Flutter when the product calls for it.',
        status: 'placeholder',
        routeLabel: 'Native Android path',
        stack: 'Kotlin + Jetpack',
        sharedFoundations: mobileSharedFoundations,
        focusAreas: [
          'Kotlin and the Android toolchain',
          'Lifecycle, configuration, permissions, and platform APIs',
          'Jetpack Compose, architecture, and native UI',
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
              'Kotlin essentials for Android: null safety, sealed types, extensions, and immutability',
              'App components, lifecycle, configuration changes, and process death',
              'Debugging with Logcat, Compose previews, the debugger, and device tools',
            ],
          },
          {
            id: 'android-compose-ui',
            number: '02',
            title: 'Compose UI and design systems',
            summary: 'Build a consistent interface with a declarative UI model that scales beyond a single screen.',
            lessons: [
              'Composition, recomposition, and state in Jetpack Compose',
              'Material 3 theming, typography, color, and reusable components',
              'Responsive layouts for phones, tablets, and foldables',
              'Accessibility with semantics, TalkBack, touch targets, and contrast',
            ],
          },
          {
            id: 'android-architecture-navigation',
            number: '03',
            title: 'Architecture and navigation',
            summary: 'Make screen behavior predictable with explicit state, feature boundaries, and resilient navigation.',
            lessons: [
              'Navigation Compose, back stack behavior, and deep links',
              'MVVM in Android: separating UI, ViewModel, UI state, and domain responsibilities',
              'ViewModel, StateFlow, and unidirectional data flow',
              'Loading, error, empty, and success states as a deliberate UI contract',
              'Feature boundaries, dependency direction, and maintainable packages',
            ],
          },
          {
            id: 'android-networking',
            number: '04',
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
            number: '05',
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
            number: '06',
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
            number: '07',
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
            number: '08',
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
            number: '09',
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
        summary: 'Build cross-platform apps with Dart and Flutter, while keeping a clear path into native Android when the platform matters.',
        status: 'placeholder',
        routeLabel: 'Cross-platform path',
        stack: 'Dart + Flutter',
        sharedFoundations: mobileSharedFoundations,
        focusAreas: [
          'Dart and the Flutter toolchain',
          'Widgets, rendering, layout, and platform channels',
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
            id: 'flutter-ui-design-systems',
            number: '02',
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
            id: 'flutter-architecture-navigation',
            number: '03',
            title: 'Architecture, state, and navigation',
            summary: 'Make screen behavior predictable with explicit state, feature boundaries, and resilient cross-platform navigation.',
            lessons: [
              'Declarative navigation, back stack behavior, and deep links',
              'MVVM in Flutter: ViewModels, UI state, and view responsibilities',
              'State ownership and dependency injection with Riverpod',
              'Loading, error, empty, and success states as a deliberate UI contract',
              'Feature boundaries, dependency direction, and maintainable packages',
            ],
          },
          {
            id: 'flutter-networking',
            number: '04',
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
            number: '05',
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
            number: '06',
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
            number: '07',
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
            number: '08',
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
            number: '09',
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
