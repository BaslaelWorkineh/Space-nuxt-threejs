export default defineNuxtConfig({
  modules: [],

  app: {
    head: {
      title: 'Space Explorer',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Explore the cosmos in 3D' }
      ]
    }
  },

  compatibilityDate: '2024-12-12'
})