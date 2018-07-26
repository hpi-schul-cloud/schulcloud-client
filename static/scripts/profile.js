import Vue from 'vue';

Vue.config.devtools = true;

import Profile from './../vue-components/Profile.vue';

console.log("profile");
alert("dklfjdlk")

var vm = new Vue({
	el: '#app',
	template: '<Profile />',
	components: { Profile }
})
