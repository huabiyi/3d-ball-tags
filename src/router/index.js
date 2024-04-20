
import App from '../components/App.vue';


export default new VueRouter({
    mode:'history',
    routes: [

        {
            path: '/',
            name: 'App',
            component: App
        },
    ]
})