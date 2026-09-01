<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import { RouterLink, useRoute } from 'vue-router'
import dockerBasicsMarkdown from '../content/docker-basics.md?raw'
import dockerMysqlDbeaverMarkdown from '../content/docker-mysql-dbeaver.md?raw'
import dockerfileBuildContextAndCacheMarkdown from '../content/dockerfile-build-context-and-cache.md?raw'
import dockerfileFirstImageMarkdown from '../content/dockerfile-first-image.md?raw'
import dockerfileImageLayersDeepDiveMarkdown from '../content/dockerfile-image-layers-deep-dive.md?raw'
import dockerfileInstructionsAndBuildArgumentsMarkdown from '../content/dockerfile-instructions-and-build-arguments.md?raw'
import dockerfileMultiStageProductionMarkdown from '../content/dockerfile-multi-stage-production.md?raw'
import dockerComposeYamlMarkdown from '../content/docker-compose-yaml.md?raw'
import dockerComposeFirstProjectMarkdown from '../content/docker-compose-first-project.md?raw'
import dockerComposeNetworkingMarkdown from '../content/docker-compose-networking.md?raw'
import dockerComposeVolumesMarkdown from '../content/docker-compose-volumes.md?raw'
import dockerComposeConfigurationReadinessMarkdown from '../content/docker-compose-configuration-readiness.md?raw'
import dockerComposeExternalNetworksMarkdown from '../content/docker-compose-external-networks.md?raw'
import { curriculumSubjects } from '../data/curriculum'
import Group2 from "../assets/Group 2.svg";

const route = useRoute()
const subjectSlug = computed(() => String(route.params.subjectSlug))
const moduleSlug = computed(() => String(route.params.moduleSlug))
const lessonSlug = computed(() => String(route.params.lessonSlug))
const subject = computed(() => curriculumSubjects.find((item) => item.id === subjectSlug.value))
const module = computed(() => subject.value?.modules?.find((item) => item.slug === moduleSlug.value))
const moduleLessons = computed(() => [
  ...(module.value?.lessons ?? []),
  ...(module.value?.supplementaryLessons ?? []),
])
const lesson = computed(() => moduleLessons.value.find((item) => item.slug === lessonSlug.value))
const lessonIndex = computed(() => moduleLessons.value.findIndex((item) => item.id === lesson.value?.id))
const previousLesson = computed(() => {
  const index = lessonIndex.value
  return index > 0 ? moduleLessons.value[index - 1] : undefined
})
const nextLesson = computed(() => {
  const index = lessonIndex.value
  const lessons = moduleLessons.value
  return index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined
})
const lessonLabel = computed(() => {
  const index = lessonIndex.value
  return index >= 0 ? `lesson ${String(index + 1).padStart(2, '0')}` : 'lesson'
})
const lessonPosition = computed(() => {
  const total = moduleLessons.value.length
  const current = lessonIndex.value >= 0 ? lessonIndex.value + 1 : 0
  return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
})
const markdownByFile: Record<string, string> = {
  'docker-basics.md': dockerBasicsMarkdown,
  'docker-mysql-dbeaver.md': dockerMysqlDbeaverMarkdown,
  'dockerfile-build-context-and-cache.md': dockerfileBuildContextAndCacheMarkdown,
  'dockerfile-first-image.md': dockerfileFirstImageMarkdown,
  'dockerfile-image-layers-deep-dive.md': dockerfileImageLayersDeepDiveMarkdown,
  'dockerfile-instructions-and-build-arguments.md': dockerfileInstructionsAndBuildArgumentsMarkdown,
  'dockerfile-multi-stage-production.md': dockerfileMultiStageProductionMarkdown,
  'docker-compose-yaml.md': dockerComposeYamlMarkdown,
  'docker-compose-first-project.md': dockerComposeFirstProjectMarkdown,
  'docker-compose-networking.md': dockerComposeNetworkingMarkdown,
  'docker-compose-volumes.md': dockerComposeVolumesMarkdown,
  'docker-compose-configuration-readiness.md': dockerComposeConfigurationReadinessMarkdown,
  'docker-compose-external-networks.md': dockerComposeExternalNetworksMarkdown,
}
const lessonHtml = computed(() => {
  const markdown = lesson.value ? markdownByFile[lesson.value.contentFile] : undefined
  return markdown ? marked(markdown, { async: false }) : ''
})
</script>

<template>
  <div class="study-shell">
    <header class="directory-header">
      <RouterLink class="brand" to="/" aria-label="Curriculum home">
        <img :src="Group2" class="brand-symbol" aria-hidden="true"/>
        <span>curriculum</span><span class="brand-dot">.</span>
      </RouterLink>
      <nav class="study-breadcrumbs" aria-label="Breadcrumb">
        <RouterLink to="/curriculum">Courses</RouterLink>
        <span aria-hidden="true">/</span>
        <RouterLink v-if="subject" :to="{ name: 'subject', params: { subjectSlug: subject.id } }">
          {{ subject.title }}
        </RouterLink>
        <span aria-hidden="true">/</span>
        <RouterLink
          v-if="subject && module"
          :to="{ name: 'module', params: { subjectSlug: subject.id, moduleSlug: module.slug } }"
        >
          {{ module.title }}
        </RouterLink>
      </nav>
    </header>

    <main v-if="subject && module && lesson" class="lesson-main">
      <header class="lesson-header">
        <p class="eyebrow"><span class="eyebrow-number">{{ module.number }}</span> {{ subject.title }} / {{ lessonLabel }}</p>
        <h1>{{ lesson.title }}</h1>
        <p>{{ lesson.summary }}</p>
        <div class="lesson-meta">
          <span>Read / {{ lesson.readTime }}</span>
          <span>{{ lesson.category }}</span>
        </div>
      </header>

      <article class="markdown-content" v-html="lessonHtml"></article>

      <nav class="lesson-footer-nav" aria-label="Lesson navigation">
        <RouterLink
          v-if="previousLesson"
          class="text-link"
          :to="{
            name: 'lesson',
            params: { subjectSlug: subject.id, moduleSlug: module.slug, lessonSlug: previousLesson.slug },
          }"
        >
          <span aria-hidden="true">&lt;-</span> Previous lesson
        </RouterLink>
        <RouterLink
          v-else
          class="text-link"
          :to="{ name: 'module', params: { subjectSlug: subject.id, moduleSlug: module.slug } }"
        >
          <span aria-hidden="true">&lt;-</span> Back to module
        </RouterLink>
        <span class="lesson-footer-status">Lesson {{ lessonPosition }}</span>
        <RouterLink
          v-if="nextLesson"
          class="text-link lesson-next-link"
          :to="{
            name: 'lesson',
            params: { subjectSlug: subject.id, moduleSlug: module.slug, lessonSlug: nextLesson.slug },
          }"
        >
          Next lesson <span aria-hidden="true">-&gt;</span>
        </RouterLink>
      </nav>
    </main>

    <main v-else class="study-main study-main--empty">
      <div class="study-empty-state">
        <p class="eyebrow"><span class="eyebrow-number">404</span> Lesson not found</p>
        <h1>This lesson is <em>not ready.</em></h1>
        <RouterLink class="button button-dark" to="/curriculum">Return to courses <span aria-hidden="true">-&gt;</span></RouterLink>
      </div>
    </main>

    <footer class="site-footer site-footer--directory">
      <span>Curriculum / field note</span>
      <span>For the long game</span>
    </footer>
  </div>
</template>
