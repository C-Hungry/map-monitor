import Vue from 'vue';
import iView from 'iview';
import VueRouter from 'vue-router';
import Routers from './router/router';
import App from './app.vue';
import 'iview/dist/styles/iview.css';
import { AlertPlugin, ToastPlugin, LoadingPlugin, ConfirmPlugin } from 'vux';
import ConfigPlugin from './config/config-plugin';
import ServicePlugin from './libs/service.plugin';
import StoragePlugin from './libs/storage.plugin';
import UtilsPlugin from './libs/utils.plugin';
import store from "./store/index";
import VueScroller from 'vue-scroller'

Vue.use(AlertPlugin);
Vue.use(ToastPlugin);
Vue.use(LoadingPlugin);
Vue.use(ConfirmPlugin);
Vue.use(VueScroller)
Vue.use(ConfigPlugin);
Vue.use(ServicePlugin);
Vue.use(StoragePlugin);
Vue.use(UtilsPlugin);
Vue.use(VueRouter);
Vue.use(iView);

// 路由配置
const RouterConfig = {
  mode: 'hash',
  routes: Routers
};
const router = new VueRouter(RouterConfig);

router.beforeEach((to, from, next) => {
  if (to.meta.title) { 
    document.title = to.meta.title;
  }
  next();
});

router.afterEach((to, from) => {
  window.scrollTo(0, 0);
});

window.VueRootInstance = new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
});