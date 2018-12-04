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

Vue.config.devtools = true;

import Search from './../../vue-components/ContentSearch.vue';

var vm = new Vue({
	el: '#app',
	template: '<Search heading="Suche in allen Inhalten" :inReview="false" :userId="userId" />',
	data: { userId: null, user: null },
	components: { Search },
	beforeMount: function () {
		this.userId = this.$el.attributes['data-user-id'].value;
  },
})