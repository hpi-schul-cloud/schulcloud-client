import "babel-polyfill";
import {render} from 'react-dom';
import { browserHistory, hashHistory, Router, Route, Link } from 'react-router';

import {App, Server} from './modules/core/helpers';

import modules from './modules';

require('file?name=[name].[ext]!./static/index.html');

const _init = () => {
	const context = {};
	const app = new App(context);
	app.loadModules(Object.values(modules));
	render(app.init(), document.getElementById('root'));
};

// Wait for server to tell us whether logged in (then) or not (catch)
Server.authenticate().then(() => {
	_init();
}).catch(() => {
	_init();
});
