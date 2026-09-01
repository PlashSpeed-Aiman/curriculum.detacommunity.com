<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { curriculumSubjects, type CurriculumSubject } from '../data/curriculum'
import Group2 from "../assets/Group 2.svg";

const expandedSubject = ref<string | null>(null)

function toggleSubject(subjectId: string) {
  expandedSubject.value = expandedSubject.value === subjectId ? null : subjectId
}

function hasExpandableContent(subject: CurriculumSubject) {
  return Boolean(subject.modules?.length || subject.tracks?.length)
}
</script>

<template>
  <div class="directory-shell">
    <header class="directory-header">
      <RouterLink class="brand" to="/" aria-label="Curriculum home">
        <img :src="Group2" class="brand-symbol" aria-hidden="true"/>
        <span>curriculum</span><span class="brand-dot">.</span>
      </RouterLink>
      <RouterLink class="text-link" to="/">
        <span aria-hidden="true">&lt;-</span> Back to overview
      </RouterLink>
    </header>

    <main class="directory-main">
      <div class="directory-intro">
        <p class="eyebrow"><span class="eyebrow-number">09</span> Subjects / self-paced</p>
        <h1>The foundations <em>route.</em></h1>
        <p>
          A sequence of subjects that compounds over time. Start at the beginning, jump to the
          question in front of you, or use the map to find your next layer.
        </p>
      </div>

      <div class="directory-list" aria-label="Curriculum subject list">
        <article
          v-for="subject in curriculumSubjects"
          :key="subject.id"
          class="directory-row"
          :class="{ 'directory-row--open': expandedSubject === subject.id }"
        >
          <div class="directory-row-main">
            <span class="directory-number">{{ subject.number }}</span>
            <div class="directory-subject">
              <h2>{{ subject.title }}</h2>
              <p>{{ subject.why }}</p>
            </div>
            <span class="directory-duration">{{ subject.duration }}</span>
            <button
              v-if="hasExpandableContent(subject)"
              type="button"
              class="directory-toggle"
              :aria-expanded="expandedSubject === subject.id"
              :aria-controls="`learn-${subject.id}`"
              :aria-label="`${expandedSubject === subject.id ? 'Hide' : 'Show'} details for ${subject.title}`"
              @click="toggleSubject(subject.id)"
            >
              <span class="directory-chevron" aria-hidden="true"></span>
            </button>
            <span v-else class="directory-arrow" aria-hidden="true">-&gt;</span>
          </div>

          <div
            v-if="hasExpandableContent(subject)"
            v-show="expandedSubject === subject.id"
            :id="`learn-${subject.id}`"
            class="directory-learn"
          >
            <div class="directory-learn-intro">
              <span class="directory-learn-kicker">Inside this subject</span>
              <h3>{{ subject.tracks ? 'Choose your track' : 'What you will learn' }}</h3>
              <RouterLink
                v-if="subject.modules"
                class="directory-subject-overview"
                :to="{ name: 'subject', params: { subjectSlug: subject.id } }"
              >
                Open subject overview <span aria-hidden="true">-&gt;</span>
              </RouterLink>
              <RouterLink
                v-else-if="subject.tracks"
                class="directory-subject-overview"
                :to="{ name: 'subject', params: { subjectSlug: subject.id } }"
              >
                Open subject overview <span aria-hidden="true">-&gt;</span>
              </RouterLink>
            </div>
            <ol class="directory-learn-list">
              <template v-if="subject.modules">
                <li v-for="module in subject.modules" :key="module.id">
                  <span class="directory-learn-number">{{ module.number }}</span>
                  <RouterLink
                    class="directory-unit-link"
                    :to="{ name: 'module', params: { subjectSlug: subject.id, moduleSlug: module.slug } }"
                  >
                    <span class="directory-unit-title">{{ module.title }}</span>
                    <span class="directory-unit-summary">{{ module.summary }}</span>
                    <span class="directory-unit-action">Open module <span aria-hidden="true">-&gt;</span></span>
                  </RouterLink>
                </li>
              </template>
              <template v-else-if="subject.tracks">
                <li v-for="track in subject.tracks" :key="track.id">
                  <span class="directory-learn-number">{{ track.title.slice(0, 1) }}</span>
                  <RouterLink
                    class="directory-unit-link"
                    :to="{ name: 'track', params: { subjectSlug: subject.id, trackSlug: track.slug } }"
                  >
                    <span class="directory-unit-title">{{ track.title }}</span>
                    <span class="directory-unit-summary">{{ track.summary }}</span>
                    <span class="directory-unit-action">Coming soon <span aria-hidden="true">-&gt;</span></span>
                  </RouterLink>
                </li>
              </template>
            </ol>
          </div>
        </article>
      </div>

      <div class="directory-note">
        <span class="directory-note-mark" aria-hidden="true">+</span>
        <p>Each subject will grow into a set of lessons, projects, and carefully chosen resources.</p>
      </div>
    </main>

    <footer class="site-footer site-footer--directory">
      <span>Curriculum / 001</span>
      <span>For the long game</span>
    </footer>
  </div>
</template>
