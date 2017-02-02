import Timetable from './containers/timetable';
import Calendar from './containers/calendar';

export default [
	{
		path: '/timetable/',
		name: 'timetable',
		component: Timetable
	},{
		path: '/calendar/',
		name: 'calendar',
		component: Calendar
	}
];
