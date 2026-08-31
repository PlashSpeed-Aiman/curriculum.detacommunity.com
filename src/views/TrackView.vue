<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { curriculumSubjects } from '../data/curriculum'

const route = useRoute()
const subjectSlug = computed(() => String(route.params.subjectSlug))
const trackSlug = computed(() => String(route.params.trackSlug))
const subject = computed(() => curriculumSubjects.find((item) => item.id === subjectSlug.value))
const track = computed(() => subject.value?.tracks?.find((item) => item.slug === trackSlug.value))
const companionTrack = computed(() =>
  subject.value?.tracks?.find((item) => item.slug === track.value?.companionSlug),
)
</script>

<template>
  <div class="study-shell">
    <header class="directory-header">
      <RouterLink class="brand" to="/" aria-label="Curriculum home">
        <span class="brand-symbol" aria-hidden="true">c/</span>
        <span>curriculum</span><span class="brand-dot">.</span>
      </RouterLink>
      <nav class="study-breadcrumbs" aria-label="Breadcrumb">
        <RouterLink to="/curriculum">Courses</RouterLink>
        <span aria-hidden="true">/</span>
        <RouterLink v-if="subject" :to="{ name: 'subject', params: { subjectSlug: subject.id } }">
          {{ subject.title }}
        </RouterLink>
        <span aria-hidden="true">/</span>
        <span>{{ track?.title ?? 'Track' }}</span>
      </nav>
    </header>

    <main v-if="subject && track" class="study-main">
      <div class="study-intro">
        <p class="eyebrow"><span class="eyebrow-number">{{ subject.number }}</span> Mobile / planned track</p>
        <h1>{{ track.title }} <em>track.</em></h1>
        <p>{{ track.summary }}</p>

        <div class="track-facts" aria-label="Track details">
          <div class="track-fact">
            <span>Route</span>
            <strong>{{ track.routeLabel }}</strong>
          </div>
          <div class="track-fact">
            <span>Core tools</span>
            <strong>{{ track.stack }}</strong>
          </div>
          <div class="track-fact">
            <span>Availability</span>
            <strong>Coming soon</strong>
          </div>
        </div>
      </div>

      <section class="track-placeholder" aria-labelledby="track-placeholder-title">
        <div class="track-placeholder-mark" aria-hidden="true">{{ subject.number }}</div>
        <div>
          <span class="study-row-kicker">Placeholder path</span>
          <h2 id="track-placeholder-title">Built to be a <em>companion.</em></h2>
          <p>
            The {{ track.title }} route is being prepared alongside
            {{ companionTrack?.title ?? 'its companion route' }}. Start with either track's shared
            mobile foundations, then move across when you want a different relationship with the
            platform.
          </p>
          <span class="track-placeholder-status">Coming soon</span>
        </div>
      </section>

      <section class="study-section track-section" aria-labelledby="shared-foundations-title">
        <div class="study-section-heading">
          <p class="eyebrow"><span class="eyebrow-number">01</span> Shared ground</p>
          <h2 id="shared-foundations-title">Start from the<br /><em>same ground.</em></h2>
        </div>

        <div>
          <p class="track-section-intro">
            The first layer is deliberately portable. Learn the product and engineering patterns
            that make either mobile route easier to enter.
          </p>
          <ol class="track-point-list">
            <li v-for="(foundation, index) in track.sharedFoundations" :key="foundation">
              <span class="track-point-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span>{{ foundation }}</span>
            </li>
          </ol>
        </div>
      </section>

      <section class="study-section track-section" aria-labelledby="focus-areas-title">
        <div class="study-section-heading">
          <p class="eyebrow"><span class="eyebrow-number">02</span> This route</p>
          <h2 id="focus-areas-title">The {{ track.title }}<br /><em>layer.</em></h2>
        </div>

        <div>
          <p class="track-section-intro">
            Once the base is in place, this route goes deeper into its own language, tools, and
            relationship with the operating system.
          </p>
          <ol class="track-point-list">
            <li v-for="(focusArea, index) in track.focusAreas" :key="focusArea">
              <span class="track-point-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span>{{ focusArea }}</span>
            </li>
          </ol>
        </div>
      </section>

      <section
        v-if="track.plannedModules?.length"
        class="study-section track-section"
        aria-labelledby="planned-sequence-title"
      >
        <div class="study-section-heading">
          <p class="eyebrow"><span class="eyebrow-number">03</span> Planned sequence</p>
          <h2 id="planned-sequence-title">Build one app<br /><em>in layers.</em></h2>
        </div>

        <div>
          <p class="track-section-intro">
            The Android route follows a production-shaped app from its first screen to its first
            release. These modules are an outline; lessons will open as they are authored.
          </p>
          <div class="track-module-list">
            <article v-for="plannedModule in track.plannedModules" :key="plannedModule.id" class="track-module">
              <div class="track-module-heading">
                <span class="track-module-number">{{ plannedModule.number }}</span>
                <div class="track-module-copy">
                  <span class="study-row-kicker">Planned module</span>
                  <h3>{{ plannedModule.title }}</h3>
                  <p>{{ plannedModule.summary }}</p>
                </div>
              </div>
              <ol class="track-lesson-list">
                <li v-for="(lesson, index) in plannedModule.lessons" :key="lesson">
                  <span>{{ String(index + 1).padStart(2, '0') }}</span>
                  <span>{{ lesson }}</span>
                </li>
              </ol>
            </article>
          </div>
        </div>
      </section>

      <section v-if="companionTrack" class="track-companion" aria-labelledby="companion-title">
        <div>
          <span class="track-companion-kicker">
            {{ track.plannedModules?.length ? '04' : '03' }} / The handoff
          </span>
          <h2 id="companion-title">The other route<br /><em>is not a reset.</em></h2>
        </div>
        <div class="track-companion-copy">
          <p>{{ track.handoff }}</p>
          <span class="track-companion-status">Companion route / coming soon</span>
          <RouterLink
            class="text-link track-companion-link"
            :to="{ name: 'track', params: { subjectSlug: subject.id, trackSlug: companionTrack.slug } }"
          >
            Preview {{ companionTrack.title }} <span aria-hidden="true">-&gt;</span>
          </RouterLink>
        </div>
      </section>

      <RouterLink
        class="text-link study-back-link"
        :to="{ name: 'subject', params: { subjectSlug: subject.id } }"
      >
        <span aria-hidden="true">&lt;-</span> Back to {{ subject.title }}
      </RouterLink>
    </main>

    <main v-else class="study-main study-main--empty">
      <div class="study-empty-state">
        <p class="eyebrow"><span class="eyebrow-number">404</span> Track not found</p>
        <h1>This track is <em>not ready.</em></h1>
        <RouterLink class="button button-dark" to="/curriculum">Return to courses <span aria-hidden="true">-&gt;</span></RouterLink>
      </div>
    </main>

    <footer class="site-footer site-footer--directory">
      <span>Curriculum / track</span>
      <span>For the long game</span>
    </footer>
  </div>
</template>
