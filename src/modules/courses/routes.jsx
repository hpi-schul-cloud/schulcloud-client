import Courses from './containers/courses';
import Course from './containers/course';

export default [
	{
		path: '/courses/',
		name: 'courses',
		component: Courses
	},
	{
		path: '/courses/:id',
		name: 'course',
		component: Course
	}
];
