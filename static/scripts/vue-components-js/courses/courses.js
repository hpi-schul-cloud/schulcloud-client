import Vue from 'vue';

import Courses from '../../../vue-components/courses/Courses.vue';

var vm = new Vue({
	el: '#vue-course-cards',
	template: '<Courses :userId="userId" :courses="courses" />',
	data: { userId: null, user: null },
	components: { Courses },
	beforeMount: function () {
		this.userId = this.$el.attributes['data-user-id'].value;
		this.courses = this.$el.attributes['data-courses'].value;
  },
})
