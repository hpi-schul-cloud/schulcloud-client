import Signup from './containers/signup';
import Setup from './containers/setup';

export default [
	{
		path: '/signup/:role/:schoolId/(:accountId/)',
		name: 'signup',
		component: Signup
	},
	{
		path: '/setup/:step/',
		name: 'setup',
		component: Setup
	}
];

