import Vue from 'vue';

import VueMaterial from 'vue-material';
import VueConfig from 'vue-config';
import VueResource from 'vue-resource';

import 'vue-material/dist/vue-material.min.css';

const configFile = require('./config');

const configs = configFile.configs;
Vue.use(VueConfig, configs);


Vue.use(VueMaterial);
Vue.use(VueResource);

import StarRating from 'vue-star-rating';
Vue.component('star-rating', StarRating);

import reviewContent from './../../vue-components/Review.vue';

var vm = new Vue({
	el: '#app',
	template: '<review-content />',
	components: {
		'review-content': reviewContent
	}
})
