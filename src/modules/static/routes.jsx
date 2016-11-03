
import Home from './containers/home';

export default [
	{
		name: 'root',
		component: Home,
		indexRoute: {
			name: 'home',
			component: Home
		},
		childRoutes: [{
			name: 'home',
			path: 'home',
			component: Home
		}]
	}
];
