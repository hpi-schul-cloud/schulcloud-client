import Vue from 'vue';

import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'

Vue.use(VueMaterial)

import App from './GenerateContent.vue';

var vm = new Vue({
	el: '#app',
	template: '<GenerateContent/>',
	components: { GenerateContent }
})
