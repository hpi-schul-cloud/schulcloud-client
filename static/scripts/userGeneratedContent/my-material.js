import Vue from 'vue';

// import { MdButton, MdContent, MdTabs, MdSteppers, MdStep } from 'vue-material/dist/components'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'

Vue.use(VueMaterial)
// Vue.use(MdButton)
// Vue.use(MdContent)
// Vue.use(MdTabs)
// Vue.use(MdSteppers)
// Vue.use(MdStep)

import App from './App.vue';

var vm = new Vue({
	el: '#app',
	template: '<App/>',
	components: { App }
})
