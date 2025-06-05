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
            title: '财经新闻'
          },
          component: () => import('../views/RealTimeMarket/index.vue')
        },
        {
          path: '/stock-market-activity',
          name: 'stock_market_activity',
          meta: {
            title: '股市异动'
          },
          component: () => import('../views/MarketActivity/index.vue')
        },
        {
          path: '/enterprise-dynamic',
          name: 'enterprise_dynamic',
          meta: {
            title: '企业动态'
          },
          component: () => import('../views/Dynamic/index.vue')
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
  