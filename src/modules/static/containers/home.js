
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import {browserHistory} from 'react-router';

import component from '../components/home';
import actions from '../actions/home';

const composer = (props, onData) => {
	browserHistory.push('/login/');
};

export default compose(composer)(component);
