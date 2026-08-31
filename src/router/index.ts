import { createRouter, createWebHistory } from 'vue-router'
import CurriculumView from '../views/CurriculumView.vue'
import HomeView from '../views/HomeView.vue'
import LessonView from '../views/LessonView.vue'
import ModuleView from '../views/ModuleView.vue'
import SubjectView from '../views/SubjectView.vue'
import TrackView from '../views/TrackView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/curriculum',
      name: 'curriculum',
      component: CurriculumView,
    },
    {
      path: '/curriculum/:subjectSlug',
      name: 'subject',
      component: SubjectView,
    },
    {
      path: '/curriculum/:subjectSlug/:moduleSlug',
      name: 'module',
      component: ModuleView,
    },
    {
      path: '/curriculum/:subjectSlug/track/:trackSlug',
      name: 'track',
      component: TrackView,
    },
    {
      path: '/curriculum/:subjectSlug/:moduleSlug/:lessonSlug',
      name: 'lesson',
      component: LessonView,
    },
  ],
})

export default router
