<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { curriculumSubjects } from '../data/curriculum'
import Group2 from '../assets/Group 2.svg'
</script>

<template>
  <div id="top" class="site-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="Curriculum home">
        <img :src="Group2" class="brand-symbol" aria-hidden="true"/>
        <span>curriculum</span><span class="brand-dot">.</span>
      </RouterLink>

      <nav class="site-nav" aria-label="Primary navigation">
        <RouterLink to="/" exact-active-class="is-active">Overview</RouterLink>
        <a href="#method">Method</a>
        <RouterLink to="/curriculum">Subjects</RouterLink>
      </nav>

      <RouterLink class="header-cta" to="/curriculum">
        Open the map <span aria-hidden="true">-&gt;</span>
      </RouterLink>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow"><span class="eyebrow-number">01</span> A self-directed curriculum</p>
          <h1 id="hero-title">Learn the ideas <em>behind</em> the tools.</h1>
          <p class="hero-description">
            A thoughtful route through the foundations of computer science, made for curious people
            who want more than a list of links.
          </p>

          <div class="hero-actions">
            <RouterLink class="button button-dark" to="/curriculum">
              Begin with the map <span aria-hidden="true">-&gt;</span>
            </RouterLink>
            <a class="text-link" href="#curriculum">
              See what is inside <span aria-hidden="true">&#8595;</span>
            </a>
          </div>

          <div class="hero-proof" aria-label="Curriculum facts">
            <div>
              <strong>09</strong>
              <span>foundations</span>
            </div>
            <div>
              <strong>01</strong>
              <span>clear route</span>
            </div>
            <div>
              <strong>0</strong>
              <span>feed distractions</span>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="visual-ring visual-ring--outer"></div>
          <div class="visual-ring visual-ring--inner"></div>
          <div class="visual-label visual-label--top">read / think / build</div>
          <div class="visual-label visual-label--bottom">for the long game</div>

          <div class="route-card">
            <div class="route-card-meta">
              <span>Curriculum / 001</span>
              <span>Self-paced</span>
            </div>
            <div class="route-card-heading">
              <h2>The foundations<br />route</h2>
              <div class="route-card-count">09<small>subjects</small></div>
            </div>

            <div class="path-diagram">
              <div class="path-step path-step--active">
                <span class="path-index">01</span>
                <span class="path-node"></span>
                <span>Docker</span>
              </div>
              <div class="path-step">
                <span class="path-index">02</span>
                <span class="path-node"></span>
                <span>Mobile apps</span>
              </div>
              <div class="path-step">
                <span class="path-index">03</span>
                <span class="path-node"></span>
                <span>Backend dev</span>
              </div>
              <div class="path-step path-step--muted">
                <span class="path-index">09</span>
                <span class="path-node"></span>
                <span>Distributed systems</span>
              </div>
            </div>

            <div class="route-card-footer">
              <span>start anywhere</span>
              <span aria-hidden="true">-&gt;</span>
            </div>
          </div>
        </div>
      </section>

      <section id="curriculum" class="curriculum-section" aria-labelledby="curriculum-title">
        <div class="section-heading">
          <p class="eyebrow"><span class="eyebrow-number">02</span> The route</p>
          <h2 id="curriculum-title">Depth over <em>distraction.</em></h2>
        </div>
        <div class="section-intro">
          <p>
            You do not need another giant catalog. You need a sequence that makes each new idea
            easier to place, test, and remember.
          </p>
          <RouterLink class="text-link" to="/curriculum">
            View all subjects <span aria-hidden="true">-&gt;</span>
          </RouterLink>
        </div>
      </section>

      <section class="subject-grid" aria-label="Curriculum subjects">
        <RouterLink
          v-for="subject in curriculumSubjects"
          :key="subject.id"
          class="subject-card"
          :class="`subject-card--${subject.accent}`"
          to="/curriculum"
        >
          <div class="subject-card-top">
            <span class="subject-number">{{ subject.number }}</span>
            <span class="subject-duration">{{ subject.duration }}</span>
          </div>
          <div class="subject-marker" aria-hidden="true"></div>
          <h3>{{ subject.title }}</h3>
          <p>{{ subject.why }}</p>
          <span class="subject-link">Explore subject <span aria-hidden="true">-&gt;</span></span>
        </RouterLink>
      </section>

      <section id="method" class="method-section" aria-labelledby="method-title">
        <div class="method-copy">
          <p class="eyebrow"><span class="eyebrow-number">03</span> The method</p>
          <h2 id="method-title">Build a habit of <em>understanding.</em></h2>
          <p>
            The best curriculum is not a finish line. It is a way to approach unfamiliar territory
            with better questions and stronger instincts.
          </p>
        </div>

        <ol class="method-steps">
          <li>
            <span class="step-number">01</span>
            <div>
              <h3>Choose a question</h3>
              <p>Start with a real thing you want to explain, not an arbitrary checklist.</p>
            </div>
          </li>
          <li>
            <span class="step-number">02</span>
            <div>
              <h3>Study one layer</h3>
              <p>Give a subject enough time to become a connected mental model.</p>
            </div>
          </li>
          <li>
            <span class="step-number">03</span>
            <div>
              <h3>Make it yours</h3>
              <p>Write, build, and explain what you learned until it survives contact with practice.</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="quote-section" aria-label="A note on learning">
        <p class="quote-mark" aria-hidden="true">&quot;</p>
        <blockquote>
          The goal is not to know everything. It is to know what to learn next, and why it matters.
        </blockquote>
        <cite>Curriculum / field note 001</cite>
      </section>

      <section class="closing-section" aria-labelledby="closing-title">
        <div>
          <p class="eyebrow"><span class="eyebrow-number">04</span> Your next hour</p>
          <h2 id="closing-title">Start with the map,<br /><em>not the noise.</em></h2>
        </div>
        <RouterLink class="button button-light" to="/curriculum">
          See the curriculum <span aria-hidden="true">-&gt;</span>
        </RouterLink>
      </section>
    </main>

    <footer class="site-footer">
      <span class="brand brand--footer"><span class="brand-symbol" aria-hidden="true">c/</span>curriculum<span class="brand-dot">.</span></span>
      <span>Make time for the fundamentals.</span>
      <a href="#top">Back to top <span aria-hidden="true">&#8593;</span></a>
    </footer>
  </div>
</template>

