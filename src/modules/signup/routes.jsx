import SignupAdmin from './containers/signup-admin';
import Signup from './containers/signup';

export default [
	{
		path: '/signup/admin/:schoolId/',
		name: 'signup-admin',
		component: SignupAdmin
	},
	{
		path: '/signup/:step/',
		name: 'signup',
		component: Signup
	}
];

