<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { curriculumSubjects } from '../data/curriculum'
import Group2 from "../assets/Group 2.svg";

const route = useRoute()
const subjectSlug = computed(() => String(route.params.subjectSlug))
const moduleSlug = computed(() => String(route.params.moduleSlug))
const subject = computed(() => curriculumSubjects.find((item) => item.id === subjectSlug.value))
const module = computed(() => subject.value?.modules?.find((item) => item.slug === moduleSlug.value))
</script>

<template>
  <div class="study-shell">
    <header class="directory-header">
      <RouterLink class="brand" to="/" aria-label="Curriculum home">
        <img :src="Group2" class="brand-symbol" aria-hidden="true"/>
        <span>curriculum</span><span class="brand-dot">.</span>
      </RouterLink>
      <nav class="study-breadcrumbs" aria-label="Breadcrumb">
        <RouterLink to="/curriculum">Subjects</RouterLink>
        <span aria-hidden="true">/</span>
        <RouterLink v-if="subject" :to="{ name: 'subject', params: { subjectSlug: subject.id } }">
          {{ subject.title }}
        </RouterLink>
        <span aria-hidden="true">/</span>
        <span>{{ module?.title ?? 'Module' }}</span>
      </nav>
    </header>

    <main v-if="subject && module" class="study-main">
      <div class="study-intro">
        <p class="eyebrow"><span class="eyebrow-number">{{ module.number }}</span> Module / {{ subject.title }}</p>
        <h1>{{ module.title }}</h1>
        <p>{{ module.summary }}</p>
      </div>

      <section class="study-section" aria-labelledby="lessons-title">
        <div class="study-section-heading">
          <p class="eyebrow"><span class="eyebrow-number">01</span> Inside the module</p>
          <h2 id="lessons-title">Take it one<br /><em>lesson at a time.</em></h2>
        </div>

        <div v-if="module.lessons.length" class="study-list">
          <article v-for="(lesson, index) in module.lessons" :key="lesson.id" class="study-row">
            <span class="study-row-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="study-row-copy">
              <span class="study-row-kicker">Lesson</span>
              <h3>{{ lesson.title }}</h3>
              <p>{{ lesson.summary }}</p>
            </div>
            <RouterLink
              class="study-row-action"
              :to="{
                name: 'lesson',
                params: { subjectSlug: subject.id, moduleSlug: module.slug, lessonSlug: lesson.slug },
              }"
            >
              Read lesson <span aria-hidden="true">-&gt;</span>
            </RouterLink>
          </article>
        </div>
        <div v-else class="study-empty-state study-empty-state--inline">
          <span class="study-row-kicker">Coming next</span>
          <p>Lessons for this module are being prepared. Return soon for the first field note.</p>
        </div>
      </section>

      <section
        v-if="module.supplementaryLessons?.length"
        class="study-section study-section--supplementary"
        aria-labelledby="supplementary-lessons-title"
      >
        <div class="study-section-heading">
          <p class="eyebrow"><span class="eyebrow-number">02</span> Supplementary study</p>
          <h2 id="supplementary-lessons-title">Go one layer<br /><em>deeper.</em></h2>
        </div>

        <div class="study-list">
          <article v-for="lesson in module.supplementaryLessons" :key="lesson.id" class="study-row">
            <span class="study-row-number">+</span>
            <div class="study-row-copy">
              <span class="study-row-kicker">Supplementary lesson</span>
              <h3>{{ lesson.title }}</h3>
              <p>{{ lesson.summary }}</p>
            </div>
            <RouterLink
              class="study-row-action"
              :to="{
                name: 'lesson',
                params: { subjectSlug: subject.id, moduleSlug: module.slug, lessonSlug: lesson.slug },
              }"
            >
              Read deep dive <span aria-hidden="true">-&gt;</span>
            </RouterLink>
          </article>
        </div>
      </section>
    </main>

    <main v-else class="study-main study-main--empty">
      <div class="study-empty-state">
        <p class="eyebrow"><span class="eyebrow-number">404</span> Module not found</p>
        <h1>This module is <em>not ready.</em></h1>
        <RouterLink class="button button-dark" to="/curriculum">Return to subjects <span aria-hidden="true">-&gt;</span></RouterLink>
      </div>
    </main>

    <footer class="site-footer site-footer--directory">
      <span>Curriculum / {{ subject?.number ?? '00' }}</span>
      <span>For the long game</span>
    </footer>
  </div>
</template>
