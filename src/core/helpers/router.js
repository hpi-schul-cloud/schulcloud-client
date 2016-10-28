import $ from "jquery";
import React from 'react';
import { render } from 'react-dom';
import { browserHistory, hashHistory, Router, Route, Link } from 'react-router';

import { Helpers, Containers } from '../../core';

let router = null;
let routes = {};

/* private functions */
const routeEnter = (nextState, replace) => {
	const bodyClass = pathToBodyClass(nextState.location.pathname);
	$('body').addClass(bodyClass);
}

const routeLeave = (prevState) => {
	const bodyClass = pathToBodyClass(prevState.location.pathname);
	$('body').removeClass(bodyClass);
}

const pathToBodyClass = (pathname) => {
	return 'route-' + (pathname.split('/')[1].toLowerCase() || 'root');
}

const addEnterLeaveHandler = (route) => {
	route.onEnter = routeEnter.bind(this);
	route.onLeave = routeLeave.bind(this);

	if((route.childRoutes || []).length) {
		route.childRoutes.map((childRoute) => {
			return addEnterLeaveHandler(childRoute);
		});
	}

	return route;
}

/* public functions */
export default {

	AddRoute: (key, {path, name, component, childRoutes}) => {
		routes[key] = addEnterLeaveHandler({
			path,
			name,
			component,
			childRoutes
		});
	},

	GetRouter: () => {
		if (router) return router;
		router = (
			<Router
				history={browserHistory}
				routes={{
					path: '/',
					component: Containers.Layout,
					indexRoute: routes['root'] || undefined,
					childRoutes: Object.values(routes)
				}}
			/>
		);

		return router;
	},

	GetRoutes: () => {
		return routes;
	}

};
