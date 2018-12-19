import Vue from 'vue';

import CourseCard from '../../../vue-components/courses/CourseCard.vue';

var vm = new Vue({
	el: '#vue-course-cards',
	template: '<CourseCard :userId="userId" />',
	data: { userId: null, user: null },
	components: { CourseCard },
	beforeMount: function () {
		this.userId = this.$el.attributes['data-user-id'].value;
  },
})
