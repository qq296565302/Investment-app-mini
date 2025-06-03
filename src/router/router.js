import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    {
      path: '/',
      redirect: '/home'
    },
    {
      path: '/home',
      name: 'home',
      redirect: '/real-time-market',
      meta: {
        title: '首页'
      },
      component: () => import('../views/PageHome.vue'),
      children: [
        {
          path: '/real-time-market',
          name: 'real-time-market',
          meta: {
            title: '实时行情'
          },
          component: () => import('../views/RealTimeMarket/index.vue')
        }
      ]
    }
  ]

const router = createRouter({
    history: createWebHashHistory(),
    routes
  })
  
  router.beforeEach((to, from, next) => {
    next()
  })
  
  export default router
  