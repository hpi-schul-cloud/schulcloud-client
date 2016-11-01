import React from 'react';
import {render} from 'react-dom';
import { browserHistory, hashHistory, Router, Route, Link } from 'react-router';

import Helpers from './modules/core/helpers';

import modules from './modules';

require('file?name=[name].[ext]!./static/index.html');

Helpers.Module.SetupModules(modules);
render(Helpers.Router.GetRouter(), document.getElementById('root'));
