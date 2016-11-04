
import {render} from 'react-dom';
import { browserHistory, hashHistory, Router, Route, Link } from 'react-router';

import {App} from './modules/core/helpers';

import modules from './modules';

require('file?name=[name].[ext]!./static/index.html');

const context = {}
const app = new App(context);
app.loadModules(Object.values(modules));
render(app.init(), document.getElementById('root'));
