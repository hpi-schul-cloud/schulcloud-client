import { browserHistory, hashHistory, Router, Route, Link } from 'react-router';
import cookieHelper from 'react-cookie';
import cookies from './cookies';

import Layout from '../components/layout';

export default class App {
	constructor(context) {
		if (!context) {
			throw new Error('Context is required when creating a new app.');
		}

		this.context = context;
		this.routes = [];
	}

	loadModules(modules = []) {
		this._checkForInit();

		if (!modules.length) {
			throw new Error('Should provide modules to load.');
		}

		modules.forEach((module) => {
			if(module.__loaded) return;
			this.loadModule(module);
		});
	}

	loadModule(module) {
		this._checkForInit();

		if (!module) {
			throw new Error('Should provide a module to load.');
		}

		if (module.__loaded) {
			throw new Error('This module is already loaded.');
		}

		if (module.routes) {
			if(Array.isArray(module.routes)) {
				this.routes.push.apply(this.routes, module.routes);
			} else {
				this.routes.push(module.routes);
			}
		}

		if (module.load) {
			if (typeof module.load !== 'function') {
				throw new Error('module.load should be a function.');
			}

			module.load(this.context);
		}

		module.__loaded = true;
	}

	init() {
		this._checkForInit();

		let indexRoute = undefined;
		const routes = this.routes.map((route) => {
			if (typeof route === 'function') {
				route = route(this.context);
			}

			if(route.path == '/') {
				indexRoute = route;
			}

			return route;
		});

		this.__initialized = true;

		return (
			<Router
				history={browserHistory}
				routes={{
					path: '/',
					component: Layout,
					indexRoute: indexRoute,
					childRoutes: routes
				}}
				onUpdate={this._checkPermissions}
			/>
		);
	}

	_checkForInit() {
		if (this.__initialized) {
			throw new Error('App is already initialized.');
		}
	}

	_checkPermissions() {
		// check login
		let currentRoute = this.props.history.getCurrentLocation().pathname;
		if (currentRoute !== '/login/' && !cookieHelper.load(cookies.userData)) {
			browserHistory.push('/login/');
		} else { // check for permissions, TODO: Refactoring !!
			let user = cookieHelper.load(cookies.userData);
			let currentRoutePermission = 0;
			this.props.routes.childRoutes.forEach((route) => {
				if (route.path === currentRoute) {
					currentRoutePermission = route.permission;
				}
			});
			let maxPermission = 0;
			user.data.roles.forEach((role) => {
				if (role.permission > maxPermission) maxPermission = role.permission;
			});

			if (currentRoutePermission > maxPermission && currentRoute !== '/dashboard/') {
				browserHistory.push('/dashboard/'); // TODO: Route to error page (permission denied, 403)
			}
		}
	}
}
