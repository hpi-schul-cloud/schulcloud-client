
import {render} from 'react-dom';
import {compose} from 'react-komposer';

import component from '../components/login';
import actions from '../actions/login';


const schools =  {
	'123': {
		_id: '123',
		name:'Schiller-Oberschule',
		systems: [{
			_id: '456',
			name:'Moodle'
		}]
	},
	'dsfdsf': {
		_id: 'dsfdsf',
		name:'Friedensburg Oberschule',
		systems: [{
			_id: 'asdasd',
			name:'Moodle'
		},
		{
			_id: 'sdfsdf',
			name:'ITSLearning'
		}]
	}
};


const composer = (props, onData) => {

	let componentData = {
		actions,
		schools
	};

	onData(null, componentData);
};

export default compose(composer)(component);
