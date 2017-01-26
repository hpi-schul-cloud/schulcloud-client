import {browserHistory, applyRouterMiddleware, Router, Route, Link} from 'react-router';
import {useScroll} from 'react-router-scroll';

import Layout from '../components/layout';
import ErrorPage from '../containers/error-page';

const _forceTrailingSlash = (prevState, nextState, replace) => {
	const path = nextState.location.pathname;
	if (path.slice(-1) !== '/') {
		replace(Object.assign(nextState.location, {
			pathname: `${path}/`
		}));
	}
};

const _getErrorPageUI = (errorCode) => {
	return (
		<ErrorPage errorCode={errorCode}/>
	);
};


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
			if (module.__loaded) return;
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
			if (Array.isArray(module.routes)) {
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

			if (route.path == '/') {
				indexRoute = route;
			}

			return route;
		});

		// force trailing slashes with redirect or not found
		routes.push({
			path: '*',
			component: _getErrorPageUI.bind(this, '404'),
			onEnter: _forceTrailingSlash.bind(this, null),
			onUpdate: _forceTrailingSlash
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
				render={applyRouterMiddleware(useScroll())}
			/>
		);
	}

	_checkForInit() {
		if (this.__initialized) {
			throw new Error('App is already initialized.');
		}
	}

}
