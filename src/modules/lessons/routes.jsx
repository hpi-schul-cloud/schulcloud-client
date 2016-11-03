
import Lesson from './containers/lesson';

export default [
	{
		path: '/lessons/',
		name: 'lessons',
		component: Lesson
	},
	{
		path: '/lessons/:id',
		name: 'lesson',
		component: Lesson
	}
];
