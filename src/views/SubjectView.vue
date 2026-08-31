<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { curriculumSubjects } from '../data/curriculum'

const route = useRoute()
const subjectSlug = computed(() => String(route.params.subjectSlug))
const subject = computed(() => curriculumSubjects.find((item) => item.id === subjectSlug.value))
const moduleCount = computed(() => subject.value?.modules?.length ?? 0)
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
        <span>{{ subject?.title ?? 'Subject' }}</span>
      </nav>
    </header>

    <main v-if="subject" class="study-main">
      <div class="study-intro">
        <p class="eyebrow"><span class="eyebrow-number">{{ subject.number }}</span> Subject / self-paced</p>
        <h1>{{ subject.title }} <em>path.</em></h1>
        <p>{{ subject.why }}</p>
      </div>

      <section v-if="subject.modules?.length" class="study-section" aria-labelledby="modules-title">
        <div class="study-section-heading">
          <p class="eyebrow"><span class="eyebrow-number">01</span> The sequence</p>
          <h2 id="modules-title">{{ moduleCount }} modules,<br /><em>one direction.</em></h2>
        </div>

        <div class="study-list">
          <article v-for="module in subject.modules ?? []" :key="module.id" class="study-row">
            <span class="study-row-number">{{ module.number }}</span>
            <div class="study-row-copy">
              <span class="study-row-kicker">Module</span>
              <h3>{{ module.title }}</h3>
              <p>{{ module.summary }}</p>
            </div>
            <RouterLink
              class="study-row-action"
              :to="{ name: 'module', params: { subjectSlug: subject.id, moduleSlug: module.slug } }"
            >
              {{ module.lessons.length ? 'Open module' : 'View outline' }}
              <span aria-hidden="true">-&gt;</span>
            </RouterLink>
          </article>
        </div>
      </section>

      <section v-else-if="subject.tracks?.length" class="study-section" aria-labelledby="tracks-title">
        <div class="study-section-heading">
          <p class="eyebrow"><span class="eyebrow-number">01</span> The routes</p>
          <h2 id="tracks-title">Choose your<br /><em>direction.</em></h2>
          <p class="track-choice-note">
            Both routes begin with the same mobile foundations. Choose a first emphasis; the other
            track is designed as a next step, not a restart.
          </p>
        </div>

        <div class="study-list">
          <article v-for="track in subject.tracks" :key="track.id" class="study-row">
            <span class="study-row-number">{{ track.title.slice(0, 1) }}</span>
            <div class="study-row-copy">
              <span class="study-row-kicker">Track / coming soon</span>
              <h3>{{ track.title }}</h3>
              <p>{{ track.summary }}</p>
            </div>
            <RouterLink
              class="study-row-action"
              :to="{ name: 'track', params: { subjectSlug: subject.id, trackSlug: track.slug } }"
            >
              Preview track <span aria-hidden="true">-&gt;</span>
            </RouterLink>
          </article>
        </div>
      </section>

      <section v-else class="study-section" aria-labelledby="empty-subject-title">
        <div class="study-section-heading">
          <p class="eyebrow"><span class="eyebrow-number">01</span> Coming next</p>
          <h2 id="empty-subject-title">The path is<br /><em>taking shape.</em></h2>
        </div>
        <div class="study-empty-state study-empty-state--inline">
          <p>Modules and lessons for this subject are being prepared.</p>
        </div>
      </section>
    </main>

    <main v-else class="study-main study-main--empty">
      <div class="study-empty-state">
        <p class="eyebrow"><span class="eyebrow-number">404</span> Subject not found</p>
        <h1>This path is <em>not ready.</em></h1>
        <RouterLink class="button button-dark" to="/curriculum">Return to subjects <span aria-hidden="true">-&gt;</span></RouterLink>
      </div>
    </main>

    <footer class="site-footer site-footer--directory">
      <span>Curriculum / {{ subject?.number ?? '00' }}</span>
      <span>For the long game</span>
    </footer>
  </div>
</template>
