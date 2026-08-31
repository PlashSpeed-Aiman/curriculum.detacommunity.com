# curriculum.

A self-directed computer science curriculum website built with Vue 3, TypeScript, Vite, and Vue Router. The current prototype includes an editorial landing page and a linked course directory inspired by the clarity of long-form study guides.

## Development

```bash
npm install
npm run dev
```

Build and preview the production bundle with:

```bash
npm run build
npm run preview
```

## Routes

- `/` - Landing page and curriculum overview
- `/curriculum` - Sample course directory
- `/curriculum/docker` - Docker course overview
- `/curriculum/docker/basics` - Docker basics module
- `/curriculum/docker/basics/setup` - Sample Markdown lesson
- `/curriculum/docker/dockerfiles` - Dockerfiles module
- `/curriculum/docker/dockerfiles/first-image` - First Dockerfile lesson
- `/curriculum/docker/dockerfiles/build-context-and-cache` - Build context and cache lesson
- `/curriculum/docker/dockerfiles/multi-stage-production` - Multi-stage production lesson
- `/curriculum/docker/dockerfiles/image-layers-deep-dive` - Image layers deep-dive lesson
- `/curriculum/mobile-app-development` - Mobile app development overview
- `/curriculum/mobile-app-development/track/android` - Android track placeholder
- `/curriculum/mobile-app-development/track/flutter` - Flutter track placeholder
- `/curriculum/backend-development` - Backend development overview
- `/curriculum/backend-development/aspnet-core` - ASP.NET Core module placeholder

Sample curriculum data is stored in `src/data/curriculum.ts`. Lesson prose is stored in `src/content/*.md` and rendered with `marked`. See the [lesson contribution guidelines](lesson-contribution-guidelines.md) for adding authored Markdown lessons. Product and implementation guidance lives in [`AGENTS.md`](AGENTS.md).
