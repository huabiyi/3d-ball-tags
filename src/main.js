
import App from './components/App.vue';
import router from './router/index.js';
import store from './store/index.js';
import api from './api/index.js';
Vue.prototype.$api = api;
new Vue({
    el: '#app',
    router,
    store,
    render: h => h(App)
}).$mount('#app')