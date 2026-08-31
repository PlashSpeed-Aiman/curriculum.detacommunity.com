<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import { RouterLink, useRoute } from 'vue-router'
import dockerBasicsMarkdown from '../content/docker-basics.md?raw'
import { curriculumSubjects } from '../data/curriculum'

const route = useRoute()
const subjectSlug = computed(() => String(route.params.subjectSlug))
const moduleSlug = computed(() => String(route.params.moduleSlug))
const lessonSlug = computed(() => String(route.params.lessonSlug))
const subject = computed(() => curriculumSubjects.find((item) => item.id === subjectSlug.value))
const module = computed(() => subject.value?.modules?.find((item) => item.slug === moduleSlug.value))
const lesson = computed(() => module.value?.lessons.find((item) => item.slug === lessonSlug.value))
const markdownByFile: Record<string, string> = {
  'docker-basics.md': dockerBasicsMarkdown,
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
        <span class="brand-symbol" aria-hidden="true">c/</span>
        <span>curriculum</span><span class="brand-dot">.</span>
      </RouterLink>
      <nav class="study-breadcrumbs" aria-label="Breadcrumb">
        <RouterLink to="/curriculum">Subjects</RouterLink>
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
        <p class="eyebrow"><span class="eyebrow-number">{{ module.number }}</span> {{ subject.title }} / lesson 01</p>
        <h1>{{ lesson.title }}</h1>
        <p>{{ lesson.summary }}</p>
        <div class="lesson-meta">
          <span>Read / 10 min</span>
          <span>Docker / foundations</span>
        </div>
      </header>

      <article class="markdown-content" v-html="lessonHtml"></article>

      <nav class="lesson-footer-nav" aria-label="Lesson navigation">
        <RouterLink
          class="text-link"
          :to="{ name: 'module', params: { subjectSlug: subject.id, moduleSlug: module.slug } }"
        >
          <span aria-hidden="true">&lt;-</span> Back to module
        </RouterLink>
        <span class="lesson-footer-status">Lesson 01 / 01</span>
      </nav>
    </main>

    <main v-else class="study-main study-main--empty">
      <div class="study-empty-state">
        <p class="eyebrow"><span class="eyebrow-number">404</span> Lesson not found</p>
        <h1>This lesson is <em>not ready.</em></h1>
        <RouterLink class="button button-dark" to="/curriculum">Return to subjects <span aria-hidden="true">-&gt;</span></RouterLink>
      </div>
    </main>

    <footer class="site-footer site-footer--directory">
      <span>Curriculum / field note</span>
      <span>For the long game</span>
    </footer>
  </div>
</template>
