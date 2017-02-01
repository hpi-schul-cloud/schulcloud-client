import Signup from './containers/signup';
import Setup from './containers/setup';

export default [
	{
		path: '/signup/:idType/:recordId/(:schoolId/)', // schoolId is needed only for SSO
		name: 'signup',
		component: Signup
	},
	{
		path: '/setup/:step/',
		name: 'setup',
		component: Setup
	}
];

